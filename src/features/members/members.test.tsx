import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import { taskKeys } from "@/features/tasks/api/tasks.keys"
import type { Task } from "@/features/tasks/api/tasks.api"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const OWNER_USER = { id: "u-1", email: "alice@example.com" }
const ADMIN_USER = { id: "u-2", email: "bob@example.com" }
const MEMBER_USER = { id: "u-3", email: "charlie@example.com" }

const membership = (role: "OWNER" | "ADMIN" | "MEMBER") => ({
  userId:
    role === "OWNER" ? OWNER_USER.id : role === "ADMIN" ? ADMIN_USER.id : MEMBER_USER.id,
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

const currentUserFor = (role: "OWNER" | "ADMIN" | "MEMBER") =>
  role === "OWNER" ? OWNER_USER : role === "ADMIN" ? ADMIN_USER : MEMBER_USER

const MEMBERS = {
  data: [
    { role: "MEMBER", joinedAt: "2026-01-03T00:00:00.000Z", user: MEMBER_USER },
    { role: "OWNER", joinedAt: "2026-01-01T00:00:00.000Z", user: OWNER_USER },
    { role: "ADMIN", joinedAt: "2026-01-02T00:00:00.000Z", user: ADMIN_USER }
  ]
}

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
  http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json(MEMBERS)),
  http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK])))
]

describe("members list", () => {
  it("renders every member with role and email, ordered OWNER, ADMIN, MEMBER", async () => {
    server.use(...authed("OWNER"))

    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })

    const rows = (await screen.findAllByRole("row")).slice(1)
    expect(within(rows[0]).getByText(OWNER_USER.email)).toBeInTheDocument()
    expect(within(rows[1]).getByText(ADMIN_USER.email)).toBeInTheDocument()
    expect(within(rows[2]).getByText(MEMBER_USER.email)).toBeInTheDocument()
  })
})

describe("add member form gating", () => {
  it("renders for OWNER", async () => {
    server.use(...authed("OWNER"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    expect(await screen.findByLabelText("Add a member")).toBeInTheDocument()
  })

  it("renders for ADMIN", async () => {
    server.use(...authed("ADMIN"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    expect(await screen.findByLabelText("Add a member")).toBeInTheDocument()
  })

  it("is absent for MEMBER", async () => {
    server.use(...authed("MEMBER"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    await screen.findAllByRole("row")
    expect(screen.queryByLabelText("Add a member")).not.toBeInTheDocument()
  })
})

describe("add member", () => {
  it("succeeds, clears the field, and the new member appears via refetch", async () => {
    const user = userEvent.setup()
    let members = MEMBERS.data
    let capturedBody: Record<string, unknown> = {}
    server.use(
      ...authed(
        "OWNER",
        http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json({ data: members })),
        http.post(`${API}/projects/:projectId/members`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          const newMember = {
            role: "MEMBER",
            joinedAt: "2026-01-04T00:00:00.000Z",
            user: { id: "u-4", email: capturedBody.email as string }
          }
          members = [...members, newMember]
          return HttpResponse.json(newMember, { status: 201 })
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    const input = await screen.findByLabelText("Add a member")
    await user.type(input, "diana@example.com")
    await user.click(screen.getByRole("button", { name: "Add member" }))

    await waitFor(() => expect(capturedBody).toEqual({ email: "diana@example.com" }))
    expect(await screen.findByText("diana@example.com")).toBeInTheDocument()
    expect(input).toHaveValue("")
  })

  it("renders a 404 on the email field, not as a form-level error", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.post(`${API}/projects/:projectId/members`, () =>
          HttpResponse.json({ message: "User not found" }, { status: 404 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    const input = await screen.findByLabelText("Add a member")
    await user.type(input, "ghost@example.com")
    await user.click(screen.getByRole("button", { name: "Add member" }))

    expect(await screen.findByText("No account uses that email address.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders a 409 on the email field, not as a form-level error", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.post(`${API}/projects/:projectId/members`, () =>
          HttpResponse.json({ message: "User is already a project member" }, { status: 409 })
        )
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    const input = await screen.findByLabelText("Add a member")
    await user.type(input, "bob@example.com")
    await user.click(screen.getByRole("button", { name: "Add member" }))

    expect(await screen.findByText("They're already a member of this project.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("role controls", () => {
  it("shows role selects for OWNER actor except on the OWNER row", async () => {
    server.use(...authed("OWNER"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })

    await screen.findAllByRole("row")
    expect(screen.getByLabelText(`Role for ${ADMIN_USER.email}`)).toBeInTheDocument()
    expect(screen.getByLabelText(`Role for ${MEMBER_USER.email}`)).toBeInTheDocument()
    expect(screen.queryByLabelText(`Role for ${OWNER_USER.email}`)).not.toBeInTheDocument()
  })

  it("shows only pills for an ADMIN actor", async () => {
    server.use(...authed("ADMIN"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })

    await screen.findAllByRole("row")
    expect(screen.queryByLabelText(`Role for ${MEMBER_USER.email}`)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(`Role for ${ADMIN_USER.email}`)).not.toBeInTheDocument()
  })
})

describe("remove controls", () => {
  it("follows canRemoveMember for an OWNER actor", async () => {
    server.use(...authed("OWNER"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })

    const rows = await screen.findAllByRole("row");
    const ownerRow = rows.find((r) => within(r).queryByText(OWNER_USER.email))!
    const adminRow = rows.find((r) => within(r).queryByText(ADMIN_USER.email))!
    const memberRow = rows.find((r) => within(r).queryByText(MEMBER_USER.email))!

    expect(within(ownerRow).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()
    expect(within(adminRow).getByRole("button", { name: "Remove" })).toBeInTheDocument()
    expect(within(memberRow).getByRole("button", { name: "Remove" })).toBeInTheDocument()
  })

  it("follows canRemoveMember for an ADMIN actor", async () => {
    server.use(...authed("ADMIN"))
    renderApp(<AppRoutes />, { route: "/projects/p-1/members" })

    const rows = await screen.findAllByRole("row")
    const adminRow = rows.find((r) => within(r).queryByText(ADMIN_USER.email))!
    const memberRow = rows.find((r) => within(r).queryByText(MEMBER_USER.email))!

    expect(within(adminRow).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()
    expect(within(memberRow).getByRole("button", { name: "Remove" })).toBeInTheDocument()
  })

  it("removal invalidates the project's task lists and open task details", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(
        "OWNER",
        http.delete(`${API}/projects/:projectId/members/:memberId`, () => new HttpResponse(null, { status: 204 }))
      )
    )

    const { queryClient } = renderApp(<AppRoutes />, { route: "/projects/p-1/members" })
    // Seed the caches removal must invalidate, as if the task list/detail were previously visited.
    queryClient.setQueryData(taskKeys.listsForProject("p-1"), paginated([TASK]))
    queryClient.setQueryData(taskKeys.detail(TASK.id), TASK)

    const rows = await screen.findAllByRole("row")
    const memberRow = rows.find((r) => within(r).queryByText(MEMBER_USER.email))!
    await user.click(within(memberRow).getByRole("button", { name: "Remove" }))

    const alert = await screen.findByRole("alertdialog")
    await user.click(within(alert).getByRole("button", { name: "Remove" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    await waitFor(() => {
      expect(queryClient.getQueryState(taskKeys.listsForProject("p-1"))?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(taskKeys.detail(TASK.id))?.isInvalidated).toBe(true)
    })
  })
})
