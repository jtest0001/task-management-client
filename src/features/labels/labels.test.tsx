import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import { taskLabelKeys } from "@/features/labels/api/labels.keys"
import type { Task } from "@/features/tasks/api/tasks.api"
import type { Label } from "@/features/labels/api/labels.api"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const OWNER_USER = { id: "u-1", email: "alice@example.com" }
const MEMBER_USER = { id: "u-3", email: "charlie@example.com" }

const membership = (role: "OWNER" | "ADMIN" | "MEMBER") => ({
  userId: role === "OWNER" ? OWNER_USER.id : MEMBER_USER.id,
  projectId: "p-1",
  role,
  joinedAt: "2026-01-01T00:00:00.000Z",
  project: {
    id: "p-1",
    name: "Website Redesign",
    description: "Marketing site refresh.",
    ownerId: OWNER_USER.id,
    createdAt: "2026-01-01T00:00:00.000Z"
  }
})

const currentUserFor = (role: "OWNER" | "ADMIN" | "MEMBER") => (role === "OWNER" ? OWNER_USER : MEMBER_USER)

const label = (overrides: Partial<Label>): Label => ({
  id: "l-1",
  name: "Frontend",
  color: "#0A7F78",
  projectId: "p-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
})

const TASK: Task = {
  id: "t-1",
  projectId: "p-1",
  title: "Fix the contrast on buttons",
  description: null,
  status: "TODO",
  priority: "HIGH",
  assigneeId: null,
  dueDate: null,
  createdById: OWNER_USER.id,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null
}

const paginated = (data: unknown[]) => ({
  data,
  pagination: { page: 1, limit: 100, totalPages: 1, total: data.length }
})

// Custom `handlers` come first: MSW matches array entries in order, so an override for a
// route already covered by a default below must be listed ahead of it to take priority.
const authed = (role: "OWNER" | "ADMIN" | "MEMBER", ...handlers: ReturnType<typeof http.get>[]) => [
  ...handlers,
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(currentUserFor(role))),
  http.get(`${API}/projects`, () => HttpResponse.json([membership(role)])),
  http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json({ data: [] })),
  http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK]))),
  http.get(`${API}/tasks/:taskId`, () => HttpResponse.json(TASK)),
  http.get(`${API}/tasks/:taskId/comments`, () => HttpResponse.json(paginated([])))
]

describe("labels definitions role gating", () => {
  it("shows the create form and row actions for OWNER", async () => {
    server.use(
      ...authed("OWNER", http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])))
    )
    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })

    expect(await screen.findByLabelText("Label name")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Frontend" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete Frontend" })).toBeInTheDocument()
  })

  it("shows the create form and row actions for ADMIN", async () => {
    server.use(
      ...authed("ADMIN", http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])))
    )
    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })

    expect(await screen.findByLabelText("Label name")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Frontend" })).toBeInTheDocument()
  })

  it("hides the create form and row actions for MEMBER", async () => {
    server.use(
      ...authed("MEMBER", http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])))
    )
    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })

    expect(await screen.findByText("Frontend")).toBeInTheDocument()
    expect(screen.queryByLabelText("Label name")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit Frontend" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete Frontend" })).not.toBeInTheDocument()
  })
})

describe("label create", () => {
  it("posts the label, clears the form, and the new label appears", async () => {
    const user = userEvent.setup()
    let labels: Label[] = []
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json(labels)),
        http.post(`${API}/projects/:projectId/labels`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          const created = label({ id: "l-new", name: capturedBody.name as string, color: capturedBody.color as string })
          labels = [created]
          return HttpResponse.json(created, { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    const nameInput = await screen.findByLabelText("Label name")
    await user.type(nameInput, "Backend")
    await user.click(screen.getByRole("button", { name: "Create label" }))

    await waitFor(() => expect(capturedBody).toEqual({ name: "Backend", color: "#0A7F78" }))
    expect(await screen.findByText("Backend")).toBeInTheDocument()
    expect(nameInput).toHaveValue("")
  })

  it("rejects an invalid hex colour client-side before any request", async () => {
    const user = userEvent.setup()
    let postCalls = 0
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([])),
        http.post(`${API}/projects/:projectId/labels`, () => {
          postCalls += 1
          return HttpResponse.json(label({}), { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    const nameInput = await screen.findByLabelText("Label name")
    await user.type(nameInput, "Bogus")
    const colorInput = screen.getByPlaceholderText("#0A7F78")
    await user.clear(colorInput)
    await user.type(colorInput, "red")
    await user.click(screen.getByRole("button", { name: "Create label" }))

    expect(await screen.findByText("Enter a six-digit hex color, e.g. #0A7F78")).toBeInTheDocument()
    expect(postCalls).toBe(0)
  })

  it("a duplicate name 409 lands on the name field", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.post(`${API}/projects/:projectId/labels`, () =>
          HttpResponse.json({ message: "Resource already exists" }, { status: 409 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    const nameInput = await screen.findByLabelText("Label name")
    await user.type(nameInput, "Frontend")
    await user.click(screen.getByRole("button", { name: "Create label" }))

    expect(
      await screen.findByText("A label with this name already exists in this project.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("label edit", () => {
  it("sends only the changed field", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.patch(`${API}/labels/:labelId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json(label({ name: capturedBody.name as string }))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    await user.click(await screen.findByRole("button", { name: "Edit Frontend" }))
    const dialog = await screen.findByRole("dialog")
    const nameInput = within(dialog).getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "Frontend Team")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(capturedBody).toEqual({ name: "Frontend Team" }))
  })

  it("an unchanged resubmit fires no request", async () => {
    const user = userEvent.setup()
    let patchCalls = 0
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.patch(`${API}/labels/:labelId`, () => {
          patchCalls += 1
          return HttpResponse.json(label({}))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    await user.click(await screen.findByRole("button", { name: "Edit Frontend" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(patchCalls).toBe(0)
  })

  it("a duplicate-name 409 on rename lands on the name field", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.patch(`${API}/labels/:labelId`, () =>
          HttpResponse.json({ message: "Resource already exists" }, { status: 409 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    await user.click(await screen.findByRole("button", { name: "Edit Frontend" }))
    const dialog = await screen.findByRole("dialog")
    const nameInput = within(dialog).getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "Backend")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    expect(
      await within(dialog).findByText("A label with this name already exists in this project.")
    ).toBeInTheDocument()
  })
})

describe("label delete", () => {
  it("shows cascade copy and invalidates task-label queries, not just the label list", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.delete(`${API}/labels/:labelId`, () => new HttpResponse(null, { status: 204 }))
      )
    )

    const { queryClient } = renderApp(<AppRoutes />, { route: "/projects/p-1/labels" })
    queryClient.setQueryData(taskLabelKeys.list("t-1"), [label({})])

    await user.click(await screen.findByRole("button", { name: "Delete Frontend" }))
    const alert = await screen.findByRole("alertdialog")
    expect(within(alert).getByText(/hard delete/i)).toBeInTheDocument()
    expect(within(alert).getByText(/cannot be undone/i)).toBeInTheDocument()

    await user.click(within(alert).getByRole("button", { name: "Delete label" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    await waitFor(() =>
      expect(queryClient.getQueryState(taskLabelKeys.list("t-1"))?.isInvalidated).toBe(true)
    )
  })
})

describe("task panel attach/detach", () => {
  it("toggles aria-pressed and attaches a label from the picker", async () => {
    const user = userEvent.setup()
    let attached: Label[] = []
    server.use(
      ...authed(
        "MEMBER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.get(`${API}/tasks/:taskId/labels`, () => HttpResponse.json(attached)),
        http.post(`${API}/tasks/:taskId/labels/:labelId`, () => {
          attached = [label({})]
          return HttpResponse.json({ taskId: "t-1", labelId: "l-1" }, { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })
    const panel = await screen.findByRole("dialog")
    await user.click(await within(panel).findByRole("button", { name: "Add label" }))

    const option = await screen.findByRole("button", { name: "Frontend" })
    expect(option).toHaveAttribute("aria-pressed", "false")
    await user.click(option)

    await waitFor(() => expect(within(panel).getByRole("button", { name: "Remove Frontend" })).toBeInTheDocument())
  })

  it("treats a 409 on attach as success and surfaces no error", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "MEMBER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.get(`${API}/tasks/:taskId/labels`, () => HttpResponse.json([])),
        http.post(`${API}/tasks/:taskId/labels/:labelId`, () =>
          HttpResponse.json({ message: "Label already attached to task" }, { status: 409 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })
    const panel = await screen.findByRole("dialog")
    await user.click(await within(panel).findByRole("button", { name: "Add label" }))
    await user.click(await screen.findByRole("button", { name: "Frontend" }))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("detach removes the chip", async () => {
    const user = userEvent.setup()
    let attached: Label[] = [label({})]
    server.use(
      ...authed(
        "MEMBER",
        http.get(`${API}/projects/:projectId/labels`, () => HttpResponse.json([label({})])),
        http.get(`${API}/tasks/:taskId/labels`, () => HttpResponse.json(attached)),
        http.delete(`${API}/tasks/:taskId/labels/:labelId`, () => {
          attached = []
          return new HttpResponse(null, { status: 204 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks/t-1" })
    const panel = await screen.findByRole("dialog")
    await user.click(await within(panel).findByRole("button", { name: "Remove Frontend" }))

    await waitFor(() =>
      expect(within(panel).queryByRole("button", { name: "Remove Frontend" })).not.toBeInTheDocument()
    )
  })
})
