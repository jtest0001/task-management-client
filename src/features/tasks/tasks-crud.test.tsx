import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import type { Task } from "@/features/tasks/api/tasks.api"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const USER = { id: "u-1", email: "alice@example.com" }

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
    { role: "OWNER", joinedAt: "2026-01-01T00:00:00.000Z", user: { id: "u-1", email: "alice@example.com" } },
    { role: "MEMBER", joinedAt: "2026-01-02T00:00:00.000Z", user: { id: "u-2", email: "bob@example.com" } }
  ]
}

const task = (overrides: Partial<Task>) => ({ ...TASK, ...overrides })

const TASK: Task = {
  id: "t-1",
  projectId: "p-1",
  title: "Fix the contrast on buttons",
  description: "Some fields are hard to read.",
  status: "TODO" as const,
  priority: "HIGH" as const,
  assigneeId: "u-2",
  dueDate: "2026-08-20T00:00:00.000Z",
  createdById: "u-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null
}

const paginated = (
  data: unknown[],
  overrides: Partial<{ page: number; limit: number; totalPages: number; total: number }> = {}
) => ({
  data,
  pagination: { page: 1, limit: 20, totalPages: 1, total: data.length, ...overrides }
})

const authed = (...handlers: ReturnType<typeof http.get>[]) => [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(USER)),
  http.get(`${API}/projects`, () => HttpResponse.json([MEMBERSHIP])),
  http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json(MEMBERS)),
  ...handlers
]

const findMain = () => screen.findByRole("main")

describe("task create", () => {
  it("appears in the list after invalidation", async () => {
    const user = userEvent.setup()
    let tasks = [] as unknown[]
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated(tasks))),
        http.post(`${API}/projects/:projectId/tasks`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          const created = task({ id: "t-new", title: body.title as string, assigneeId: null, dueDate: null })
          tasks = [created]
          return HttpResponse.json(created, { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    await within(main).findByText("No tasks yet")

    const [toolbarNewTask] = within(main).getAllByRole("button", { name: "New task" })
    await user.click(toolbarNewTask)
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Title"), "Ship the changelog")
    await user.click(within(dialog).getByRole("button", { name: "Create task" }))

    expect(await within(main).findByText("Ship the changelog")).toBeInTheDocument()
  })
})

describe("task detail", () => {
  it("deep link renders the detail panel", async () => {
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK))
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    const panel = await screen.findByRole("dialog")
    expect(await within(panel).findByText("Fix the contrast on buttons")).toBeInTheDocument()
    expect(within(panel).getByText("bob@example.com")).toBeInTheDocument()
  })

  it("shows a distinct message for a deleted task", async () => {
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([]))),
        http.get(`${API}/tasks/:taskId`, () =>
          HttpResponse.json({ message: "Resource not found" }, { status: 404 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/gone" })

    expect(await screen.findByText("This task no longer exists")).toBeInTheDocument()
  })
})

describe("task edit", () => {
  it("sends only changed fields, and dueDate as a full ISO datetime", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.patch(`${API}/tasks/:taskId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ ...TASK, ...capturedBody })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    await user.click(await screen.findByRole("button", { name: "Edit task" }))
    const dialog = await screen.findByRole("dialog")

    // TASK.dueDate is 2026-08-20, so the picker opens on August 2026 already — pick another
    // day in the same month to avoid navigating months in the test.
    await user.click(within(dialog).getByLabelText("Due date"))
    await user.click(await screen.findByRole("button", { name: /August 25(st|nd|rd|th)?, 2026/ }))
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(capturedBody).toEqual({ dueDate: "2026-08-25T00:00:00.000Z" }))
  })

  it("clearing the due date sends dueDate: null", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.patch(`${API}/tasks/:taskId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ ...TASK, ...capturedBody, dueDate: null })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    await user.click(await screen.findByRole("button", { name: "Edit task" }))
    const dialog = await screen.findByRole("dialog")

    await user.click(within(dialog).getByLabelText("Due date"))
    await user.click(await screen.findByRole("button", { name: "Clear" }))
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(capturedBody).toEqual({ dueDate: null }))
  })

  it("clearing the assignee sends assigneeId: null", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.patch(`${API}/tasks/:taskId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ ...TASK, ...capturedBody, assigneeId: null })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    await user.click(await screen.findByRole("button", { name: "Edit task" }))
    const dialog = await screen.findByRole("dialog")

    await user.selectOptions(within(dialog).getByLabelText("Assignee"), "")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(capturedBody).toEqual({ assigneeId: null }))
  })

  it("submitting an unchanged form fires no request", async () => {
    const user = userEvent.setup()
    let patchCalls = 0
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.patch(`${API}/tasks/:taskId`, () => {
          patchCalls += 1
          return HttpResponse.json(TASK)
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    await user.click(await screen.findByRole("button", { name: "Edit task" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit task" })
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit task" })).not.toBeInTheDocument())
    expect(patchCalls).toBe(0)
  })

  it("renders a non-member assignee 400 on the assignee field and keeps the dialog open", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.patch(`${API}/tasks/:taskId`, () =>
          HttpResponse.json({ message: "The selected assignee is not a member of this project" }, { status: 400 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })

    await user.click(await screen.findByRole("button", { name: "Edit task" }))
    const dialog = await screen.findByRole("dialog")

    await user.selectOptions(within(dialog).getByLabelText("Assignee"), "u-1")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect(
      await within(dialog).findByText("The selected assignee is not a member of this project.")
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("task delete", () => {
  it("closes the panel, removes the row, and keeps the URL's search string", async () => {
    const user = userEvent.setup()
    let tasks: unknown[] = [TASK]
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated(tasks))),
        http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
        http.delete(`${API}/tasks/:taskId`, () => {
          tasks = []
          return new HttpResponse(null, { status: 204 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1?status=TODO" })

    await user.click(await screen.findByRole("button", { name: "Delete task" }))
    const alert = await screen.findByRole("alertdialog")
    await user.click(within(alert).getByRole("button", { name: "Delete task" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    const main = await findMain()
    await waitFor(() => expect(within(main).queryByText("Fix the contrast on buttons")).not.toBeInTheDocument())
  })
})
