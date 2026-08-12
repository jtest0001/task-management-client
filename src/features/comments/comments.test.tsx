import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import type { Comment } from "@/features/comments/api/comments.api"
import type { Task } from "@/features/tasks/api/tasks.api"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const USER = { id: "u-1", email: "alice@example.com" }
const OTHER = { id: "u-2", email: "bob@example.com" }

const MEMBERSHIP = {
  userId: USER.id,
  projectId: "p-1",
  role: "OWNER" as const,
  joinedAt: "2026-01-01T00:00:00.000Z",
  project: {
    id: "p-1",
    name: "Website Redesign",
    description: "Marketing site refresh.",
    ownerId: USER.id,
    createdAt: "2026-01-01T00:00:00.000Z"
  }
}

const MEMBERS = {
  data: [
    { role: "OWNER", joinedAt: "2026-01-01T00:00:00.000Z", user: USER },
    { role: "MEMBER", joinedAt: "2026-01-02T00:00:00.000Z", user: OTHER }
  ]
}

const TASK: Task = {
  id: "t-1",
  projectId: "p-1",
  title: "Fix the contrast on buttons",
  description: "Some fields are hard to read.",
  status: "TODO",
  priority: "HIGH",
  assigneeId: null,
  dueDate: null,
  createdById: "u-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null
}

const paginated = (data: unknown[], overrides: Partial<{ total: number }> = {}) => ({
  data,
  pagination: { page: 1, limit: 100, totalPages: 1, total: data.length, ...overrides }
})

const comment = (overrides: Partial<Comment>): Comment => ({
  id: "c-1",
  content: "Looks good to me.",
  author: USER,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
})

const authed = (...handlers: ReturnType<typeof http.get>[]) => [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(USER)),
  http.get(`${API}/projects`, () => HttpResponse.json([MEMBERSHIP])),
  http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json(MEMBERS)),
  http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
  http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
  ...handlers
]

const openPanel = async () => screen.findByRole("dialog")

describe("comments list", () => {
  it("renders a task's comments oldest first with author emails", async () => {
    const comments = [
      comment({ id: "c-1", content: "First.", author: USER, createdAt: "2026-01-01T00:00:00.000Z" }),
      comment({ id: "c-2", content: "Second.", author: OTHER, createdAt: "2026-01-02T00:00:00.000Z" })
    ]
    server.use(
      ...authed(http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated(comments))))
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    const items = await within(panel).findAllByRole("listitem")
    expect(within(items[0]).getByText("alice@example.com")).toBeInTheDocument()
    expect(within(items[1]).getByText("bob@example.com")).toBeInTheDocument()
  })

  it("shows an empty message when there are no comments", async () => {
    server.use(...authed(http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([])))))

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    expect(await within(panel).findByText("No comments yet.")).toBeInTheDocument()
  })

  it("collapses long threads to the newest comments and expands without another request", async () => {
    const user = userEvent.setup()
    const comments = Array.from({ length: 7 }, (_, i) =>
      comment({ id: `c-${i}`, content: `Comment ${i}`, createdAt: `2026-01-0${(i % 9) + 1}T00:00:00.000Z` })
    )
    let requestCount = 0
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => {
          requestCount += 1
          return HttpResponse.json(paginated(comments))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await within(panel).findByText("Comment 6")
    expect(within(panel).queryByText("Comment 0")).not.toBeInTheDocument()

    const requestsAfterLoad = requestCount
    await user.click(within(panel).getByRole("button", { name: "Show all 7 comments" }))

    expect(within(panel).getByText("Comment 0")).toBeInTheDocument()
    expect(requestCount).toBe(requestsAfterLoad)
  })
})

describe("comment create", () => {
  it("posts content and clears the composer after invalidation", async () => {
    const user = userEvent.setup()
    let comments: Comment[] = []
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated(comments))),
        http.post(`${API}/tasks/:taskId/comments`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          const created = comment({ id: "c-new", content: capturedBody.content as string })
          comments = [created]
          return HttpResponse.json(created, { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await within(panel).findByText("No comments yet.")

    const input = within(panel).getByPlaceholderText("Add a comment…")
    await user.type(input, "New comment")
    await user.click(within(panel).getByRole("button", { name: "Comment" }))

    await waitFor(() => expect(capturedBody).toEqual({ content: "New comment" }))
    expect(await within(panel).findByText("New comment")).toBeInTheDocument()
    expect(input).toHaveValue("")
  })

  it("blocks whitespace-only content client-side", async () => {
    const user = userEvent.setup()
    let postCalls = 0
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([]))),
        http.post(`${API}/tasks/:taskId/comments`, () => {
          postCalls += 1
          return HttpResponse.json(comment({}), { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await within(panel).findByText("No comments yet.")
    const input = within(panel).getByPlaceholderText("Add a comment…")
    await user.type(input, "   ")
    await user.click(within(panel).getByRole("button", { name: "Comment" }))

    expect(await within(panel).findByText("Comment cannot be empty")).toBeInTheDocument()
    expect(postCalls).toBe(0)
  })
})

describe("comment ownership", () => {
  it("shows edit and delete only on the signed-in user's own comment", async () => {
    const comments = [
      comment({ id: "c-1", author: USER, content: "Mine." }),
      comment({ id: "c-2", author: OTHER, content: "Not mine." })
    ]
    server.use(
      ...authed(http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated(comments))))
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    const items = await within(panel).findAllByRole("listitem")
    expect(within(items[0]).getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(within(items[0]).getByRole("button", { name: "Delete" })).toBeInTheDocument()
    expect(within(items[1]).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
    expect(within(items[1]).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument()
  })
})

describe("comment edit", () => {
  it("sends PATCH with the new content", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([comment({})]))),
        http.patch(`${API}/comments/:commentId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json(comment({ content: capturedBody.content as string }))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await user.click(await within(panel).findByRole("button", { name: "Edit" }))
    const textarea = within(panel).getByDisplayValue("Looks good to me.")
    await user.clear(textarea)
    await user.type(textarea, "Updated content.")
    await user.click(within(panel).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(capturedBody).toEqual({ content: "Updated content." }))
  })

  it("resubmitting unchanged text fires no request", async () => {
    const user = userEvent.setup()
    let patchCalls = 0
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([comment({})]))),
        http.patch(`${API}/comments/:commentId`, () => {
          patchCalls += 1
          return HttpResponse.json(comment({}))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await user.click(await within(panel).findByRole("button", { name: "Edit" }))
    await user.click(within(panel).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(within(panel).queryByRole("button", { name: "Save" })).not.toBeInTheDocument())
    expect(patchCalls).toBe(0)
  })

  it("a 403 on edit surfaces at form level and keeps the form open with its text", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([comment({})]))),
        http.patch(`${API}/comments/:commentId`, () =>
          HttpResponse.json({ message: "You do not have permission to do that." }, { status: 403 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await user.click(await within(panel).findByRole("button", { name: "Edit" }))
    const textarea = within(panel).getByDisplayValue("Looks good to me.")
    await user.type(textarea, " More.")
    await user.click(within(panel).getByRole("button", { name: "Save" }))

    expect(await within(panel).findByText("You do not have permission to do that.")).toBeInTheDocument()
    expect(within(panel).getByDisplayValue("Looks good to me. More.")).toBeInTheDocument()
  })
})

describe("comment delete", () => {
  it("removes the comment on confirm and keeps the panel open", async () => {
    const user = userEvent.setup()
    let comments = [comment({})]
    server.use(
      ...authed(
        http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated(comments))),
        http.delete(`${API}/comments/:commentId`, () => {
          comments = []
          return new HttpResponse(null, { status: 204 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await openPanel()
    await user.click(await within(panel).findByRole("button", { name: "Delete" }))
    const alert = await screen.findByRole("alertdialog")
    await user.click(within(alert).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    await waitFor(() => expect(within(panel).queryByText("Looks good to me.")).not.toBeInTheDocument())
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
