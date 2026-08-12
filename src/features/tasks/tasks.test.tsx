import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
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

const task = (overrides: Partial<(typeof TASK)>) => ({ ...TASK, ...overrides })

const TASK = {
  id: "t-1",
  projectId: "p-1",
  title: "Fix the contrast on buttons",
  description: null,
  status: "TODO" as const,
  priority: "HIGH" as const,
  assigneeId: "u-2",
  dueDate: "2026-08-20T00:00:00.000Z",
  createdById: "u-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null
}

const paginated = (data: unknown[], overrides: Partial<{ page: number; limit: number; totalPages: number; total: number }> = {}) => ({
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

describe("tasks page", () => {
  it("renders rows joined against members: title, status, priority, assignee, due date", async () => {
    server.use(...authed(http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([TASK])))))

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    expect(await within(main).findByText("Fix the contrast on buttons")).toBeInTheDocument()
    const table = within(main).getByRole("table")
    expect(within(table).getByText("To do")).toBeInTheDocument()
    expect(within(table).getByText("High")).toBeInTheDocument()
    expect(await within(table).findByText("bob")).toBeInTheDocument()
    expect(within(table).getByText(/Aug 20/)).toBeInTheDocument()
  })

  it("carries the URL's params exactly on the outgoing request", async () => {
    let capturedUrl = ""
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(paginated([]))
        })
      )
    )

    renderApp(<AppRoutes />, {
      route: "/projects/p-1/tasks?status=DONE&page=2&sortBy=title&sortOrder=asc"
    })

    await findMain()
    await waitFor(() => expect(capturedUrl).toContain("status=DONE"))
    const url = new URL(capturedUrl)
    expect(url.searchParams.get("status")).toBe("DONE")
    expect(url.searchParams.get("page")).toBe("2")
    expect(url.searchParams.get("sortBy")).toBe("title")
    expect(url.searchParams.get("sortOrder")).toBe("asc")
  })

  it("resets to page 1 when a filter changes", async () => {
    const user = userEvent.setup()
    let capturedUrl = ""
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(paginated([TASK], { page: capturedUrl.includes("page=2") ? 2 : 1 }))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks?page=2" })

    const main = await findMain()
    await within(main).findByText("Fix the contrast on buttons")

    await user.selectOptions(within(main).getByLabelText("Filter by status"), "DONE")

    await waitFor(() => {
      const url = new URL(capturedUrl)
      expect(url.searchParams.get("status")).toBe("DONE")
      // The API always receives an explicit page; it's the browser URL that omits page=1.
      expect(url.searchParams.get("page")).toBe("1")
    })
  })

  it("keeps a filter changed while the search debounce is still pending", async () => {
    const user = userEvent.setup()
    let capturedUrl = ""
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(paginated([]))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    await within(main).findByText("No tasks yet")

    await user.type(within(main).getByLabelText("Search tasks by title"), "contrast")
    // Committed before the 300ms search debounce elapses.
    await user.selectOptions(within(main).getByLabelText("Filter by status"), "DONE")

    await waitFor(() => {
      expect(new URL(capturedUrl).searchParams.get("status")).toBe("DONE")
    })

    // Once the debounce fires, the status change made in the interim must still be applied.
    await waitFor(
      () => {
        const url = new URL(capturedUrl)
        expect(url.searchParams.get("search")).toBe("contrast")
        expect(url.searchParams.get("status")).toBe("DONE")
      },
      { timeout: 1000 }
    )
  })

  it("shows 'No tasks yet' when empty with no filters active", async () => {
    server.use(...authed(http.get(`${API}/projects/:projectId/tasks`, () => HttpResponse.json(paginated([])))))

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    expect(await within(main).findByText("No tasks yet")).toBeInTheDocument()
  })

  it("shows 'No tasks match these filters' when empty with a filter active, and Clear filters refetches with none", async () => {
    const user = userEvent.setup()
    let lastUrl = ""
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, ({ request }) => {
          lastUrl = request.url
          return HttpResponse.json(paginated([]))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks?status=DONE" })

    const main = await findMain()
    expect(await within(main).findByText("No tasks match these filters")).toBeInTheDocument()

    await user.click(within(main).getByRole("button", { name: "Clear filters" }))

    await waitFor(() => {
      const url = new URL(lastUrl)
      expect(url.searchParams.get("status")).toBeNull()
    })
  })

  it("shows an error state with retry on a failed fetch", async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, () => {
          calls += 1
          return calls === 1
            ? HttpResponse.json({ message: "Internal server error" }, { status: 500 })
            : HttpResponse.json(paginated([TASK]))
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    expect(await within(main).findByText("Something went wrong")).toBeInTheDocument()
    await user.click(within(main).getByRole("button", { name: "Try again" }))

    expect(await within(main).findByText("Fix the contrast on buttons")).toBeInTheDocument()
  })

  it("advances the page on Next and disables it on the last page", async () => {
    const user = userEvent.setup()
    let capturedUrl = ""
    server.use(
      ...authed(
        http.get(`${API}/projects/:projectId/tasks`, ({ request }) => {
          capturedUrl = request.url
          const page = new URL(request.url).searchParams.get("page") ?? "1"
          return HttpResponse.json(
            paginated([task({ id: `t-${page}` })], { page: Number(page), totalPages: 2, total: 2 })
          )
        })
      )
    )

    renderApp(<AppRoutes />, { route: "/projects/p-1/tasks" })

    const main = await findMain()
    await within(main).findByText("Fix the contrast on buttons")

    await user.click(within(main).getByRole("button", { name: "Next" }))

    await waitFor(() => {
      const url = new URL(capturedUrl)
      expect(url.searchParams.get("page")).toBe("2")
    })

    expect(await within(main).findByRole("button", { name: "Next" })).toBeDisabled()
  })
})
