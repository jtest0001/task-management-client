import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const USER = { id: "u-1", email: "alice@example.com" }

const membership = (role: "OWNER" | "ADMIN") => ({
  userId: USER.id,
  projectId: "p-1",
  role,
  joinedAt: "2026-01-01T00:00:00.000Z",
  project: {
    id: "p-1",
    name: "Website Redesign",
    description: "Marketing site refresh before the Q4 launch.",
    ownerId: role === "OWNER" ? USER.id : "someone-else",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
})

const authed = (...handlers: ReturnType<typeof http.get>[]) => [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(USER)),
  ...handlers
]

describe("project workspace shell", () => {
  it("shows Rename and Delete for an OWNER", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([membership("OWNER")]))))

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    expect(await screen.findByRole("heading", { name: "Website Redesign" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Project" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete project" })).toBeInTheDocument()
  })

  it("hides Edit Project and Delete for an ADMIN, who can still see the project", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([membership("ADMIN")]))))

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    expect(await screen.findByRole("heading", { name: "Website Redesign" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit Project" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete project" })).not.toBeInTheDocument()
  })

  it("renders a not-found state for a project the caller is not a member of", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([]))))

    renderApp(<AppRoutes />, { route: "/projects/unknown/tasks" })

    expect(await screen.findByText("Project not found")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to projects" })).toBeInTheDocument()
  })

  it("redirects the workspace index to the Tasks tab", async () => {
    server.use(...authed(http.get(`${API}/projects`, () => HttpResponse.json([membership("OWNER")]))))

    renderApp(<AppRoutes />, { route: "/projects/p-1" })

    expect(await screen.findByRole("heading", { name: "Tasks" })).toBeInTheDocument()
  })

  it("renames a project and reflects the change without a page reload", async () => {
    const user = userEvent.setup()
    let name = "Website Redesign"
    server.use(
      ...authed(
        http.get(`${API}/projects`, () =>
          HttpResponse.json([{ ...membership("OWNER"), project: { ...membership("OWNER").project, name } }])
        )
      ),
      http.patch(`${API}/projects/p-1`, async ({ request }) => {
        const body = (await request.json()) as { name?: string }
        if (body.name) name = body.name
        return HttpResponse.json({
          id: "p-1",
          name,
          description: "Marketing site refresh before the Q4 launch.",
          ownerId: USER.id,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-04T00:00:00.000Z",
          deletedAt: null
        })
      })
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    await user.click(await screen.findByRole("button", { name: "Edit Project" }))
    const dialog = await screen.findByRole("dialog")

    const nameInput = within(dialog).getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "Website Relaunch")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(await screen.findByRole("heading", { name: "Website Relaunch" })).toBeInTheDocument()
  })
})
