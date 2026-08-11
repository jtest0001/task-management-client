import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const USER = { id: "u-1", email: "alice@example.com" }

const OWNED = {
  userId: USER.id,
  projectId: "p-owned",
  role: "OWNER" as const,
  joinedAt: "2026-01-01T00:00:00.000Z",
  project: {
    id: "p-owned",
    name: "Zeta Migration",
    description: "Move the legacy service.",
    ownerId: USER.id,
    createdAt: "2026-01-01T00:00:00.000Z"
  }
}

const MEMBER_OF = {
  userId: USER.id,
  projectId: "p-member",
  role: "ADMIN" as const,
  joinedAt: "2026-01-02T00:00:00.000Z",
  project: {
    id: "p-member",
    name: "Alpha Launch",
    description: null,
    ownerId: "someone-else",
    createdAt: "2026-01-02T00:00:00.000Z"
  }
}

// The "create project" test navigates into the new project's Tasks tab, which fires its own
// list + members requests.
const authed = (projectsHandler: ReturnType<typeof http.get>) => [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(USER)),
  http.get(`${API}/projects/:projectId/tasks`, () =>
    HttpResponse.json({ data: [], pagination: { page: 1, limit: 20, totalPages: 1, total: 0 } })
  ),
  http.get(`${API}/projects/:projectId/members`, () => HttpResponse.json({ data: [] })),
  projectsHandler
]

// The sidebar (`ProjectNav`) and the page both derive from the same `GET /projects` query, so
// they render matching empty/error states side by side — every query here must be scoped to
// `<main>` or it matches twice. The sidebar also carries its own "New project" trigger (an
// icon button next to the "Projects" heading), so button lookups need the same scoping.
const findMain = () => screen.findByRole("main")
const findSidebar = () => screen.findByRole("navigation", { name: "Projects" })

describe("projects page", () => {
  it("renders projects sorted by name, regardless of feed order", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([OWNED, MEMBER_OF]))))

    renderApp(<AppRoutes />, { route: "/projects" })

    await screen.findByRole("heading", { name: "Projects" })
    const main = await findMain()
    const names = (await within(main).findAllByRole("link")).map((link) => link.textContent)
    const zetaIndex = names.findIndex((n) => n?.includes("Zeta Migration"))
    const alphaIndex = names.findIndex((n) => n?.includes("Alpha Launch"))
    expect(alphaIndex).toBeLessThan(zetaIndex)
  })

  it("shows an empty state with a create action when the caller has no projects", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([]))))

    renderApp(<AppRoutes />, { route: "/projects" })

    const main = await findMain()
    expect(await within(main).findByText("No projects yet")).toBeInTheDocument()
    expect(within(main).getByRole("button", { name: "New project" })).toBeInTheDocument()
  })

  it("shows an error state with retry on a failed fetch", async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      ...authed(
        http.get(`${API}/projects`, () => {
          calls += 1
          return calls === 1
            ? HttpResponse.json({ message: "Internal server error" }, { status: 500 })
            : HttpResponse.json([OWNED])
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects" })

    const main = await findMain()
    expect(await within(main).findByText("Something went wrong")).toBeInTheDocument()
    await user.click(within(main).getByRole("button", { name: "Try again" }))

    expect(await within(main).findByText("Zeta Migration")).toBeInTheDocument()
  })

  it("creates a project through the dialog and navigates into its workspace", async () => {
    const user = userEvent.setup()
    // The workspace derives its project from `GET /projects` (Decision 1 in
    // docs/phase-3-projects.md), so the list must actually gain the new row after create
    // invalidates it — a static empty response would strand the redirect on "not found".
    let memberships: unknown[] = []
    server.use(
      ...authed(http.get(`${API}/projects`, () => HttpResponse.json(memberships))),
      http.post(`${API}/projects`, async ({ request }) => {
        const body = (await request.json()) as { name: string; description?: string }
        const project = {
          id: "p-new",
          name: body.name,
          description: body.description ?? null,
          ownerId: USER.id,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
          deletedAt: null
        }
        memberships = [
          ...memberships,
          { userId: USER.id, projectId: project.id, role: "OWNER", joinedAt: project.createdAt, project }
        ]
        return HttpResponse.json(project)
      })
    )

    renderApp(<AppRoutes />, { route: "/projects" })

    const main = await findMain()
    await user.click(await within(main).findByRole("button", { name: "New project" }))
    const dialog = await screen.findByRole("dialog")

    await user.type(within(dialog).getByLabelText("Name"), "Design Refresh")
    await user.click(within(dialog).getByRole("button", { name: "Create project" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(await screen.findByRole("heading", { name: "Design Refresh" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Tasks" })).toBeInTheDocument()
  })

  it("maps a duplicate-name 409 onto the name field and keeps the dialog open", async () => {
    const user = userEvent.setup()
    server.use(
      ...authed(http.get(`${API}/projects`, () => HttpResponse.json([OWNED]))),
      http.post(`${API}/projects`, () =>
        HttpResponse.json({ message: "Resource already exists" }, { status: 409 })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects" })

    const sidebar = await findSidebar()
    await user.click(await within(sidebar).findByRole("button", { name: "New project" }))
    const dialog = await screen.findByRole("dialog")

    await user.type(within(dialog).getByLabelText("Name"), "Zeta Migration")
    await user.click(within(dialog).getByRole("button", { name: "Create project" }))

    expect(
      await within(dialog).findByText("You already have a project with this name.")
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
