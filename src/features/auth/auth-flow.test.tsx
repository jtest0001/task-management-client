import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { AppRoutes } from "@/app/router/router"
import { authKeys } from "@/features/auth/api/auth.keys"
import { renderApp } from "@/test/render"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"
const USER = { id: "u-1", email: "alice@example.com" }

const signedOut = () =>
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 }))

const signedIn = () => [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: "access-token" })),
  http.get(`${API}/auth/me`, () => HttpResponse.json(USER))
]

describe("authentication", () => {
  it("restores an existing session on boot without flashing the login page", async () => {
    server.use(...signedIn())

    renderApp(<AppRoutes />, { route: "/projects" })

    // The guard must render its loading state, never the login form, while boot is pending.
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument()
  })

  it("sends an unauthenticated visitor to the login page", async () => {
    server.use(signedOut())

    renderApp(<AppRoutes />, { route: "/projects" })

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  it("signs in and lands on the page the guard interrupted", async () => {
    const user = userEvent.setup()
    server.use(
      signedOut(),
      http.post(`${API}/auth/login`, () => HttpResponse.json({ user: USER, accessToken: "access-token" })),
      http.get(`${API}/auth/me`, () => HttpResponse.json(USER))
    )

    renderApp(<AppRoutes />, { route: "/projects" })

    await user.type(await screen.findByLabelText("Email"), USER.email)
    await user.type(screen.getByLabelText("Password"), "Password123!")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument()
  })

  it("shows a form-level error on bad credentials and stays put", async () => {
    const user = userEvent.setup()
    server.use(
      signedOut(),
      http.post(`${API}/auth/login`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 }))
    )

    renderApp(<AppRoutes />, { route: "/login" })

    await user.type(await screen.findByLabelText("Email"), USER.email)
    await user.type(screen.getByLabelText("Password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized")
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
  })

  it("validates credentials client-side before touching the network", async () => {
    const user = userEvent.setup()
    server.use(signedOut())

    renderApp(<AppRoutes />, { route: "/login" })

    await user.type(await screen.findByLabelText("Email"), "not-an-email")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    // No `/auth/login` handler is registered; reaching the network would fail the test.
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument()
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument()
  })

  it("maps a duplicate-email 409 onto the email field", async () => {
    const user = userEvent.setup()
    server.use(
      signedOut(),
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json({ message: "Email already registered" }, { status: 409 })
      )
    )

    renderApp(<AppRoutes />, { route: "/register" })

    await user.type(await screen.findByLabelText("Email"), USER.email)
    await user.type(screen.getByLabelText("Password"), "Password123!")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("That email is already registered.")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
  })

  it("registers then signs in, since the backend's register returns no session", async () => {
    const user = userEvent.setup()
    let registered = false
    server.use(
      signedOut(),
      http.post(`${API}/auth/register`, () => {
        registered = true
        return HttpResponse.json(USER, { status: 201 })
      }),
      http.post(`${API}/auth/login`, () => HttpResponse.json({ user: USER, accessToken: "access-token" })),
      http.get(`${API}/auth/me`, () => HttpResponse.json(USER))
    )

    renderApp(<AppRoutes />, { route: "/register" })

    await user.type(await screen.findByLabelText("Email"), USER.email)
    await user.type(screen.getByLabelText("Password"), "Password123!")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument()
    expect(registered).toBe(true)
  })

  it("signs out, clears the cache and returns to login", async () => {
    const user = userEvent.setup()
    server.use(
      ...signedIn(),
      http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 }))
    )

    const { queryClient } = renderApp(<AppRoutes />, { route: "/projects" })

    await screen.findByRole("heading", { name: "Projects" })
    await user.click(screen.getByRole("button", { name: "Account menu" }))
    await user.click(await screen.findByRole("menuitem", { name: /sign out/i }))

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument()

    // The signed-out `me` observer is still mounted (disabled), so it re-registers an empty
    // cache entry. What must not survive is the previous user's data.
    await waitFor(() => {
      expect(queryClient.getQueryData(authKeys.me())).toBeUndefined()
    })
  })
})
