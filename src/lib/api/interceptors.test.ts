import { HttpResponse, http } from "msw"
import { describe, expect, it, vi } from "vitest"

import { apiClient } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { onAuthFailure } from "@/lib/api/refresh"
import { getAccessToken, setAccessToken } from "@/lib/api/token-store"
import { server } from "@/test/msw/server"

const API = "http://localhost:3000"

describe("refresh-on-401 interceptor", () => {
  it("dedupes concurrent 401s into a single refresh and retries every request", async () => {
    let refreshCount = 0
    setAccessToken("expired-token")

    server.use(
      http.post(`${API}/auth/refresh`, async () => {
        refreshCount += 1
        // Hold the response open so all three 401s are in flight before it settles —
        // without a shared promise this is exactly where three refreshes would be sent.
        await new Promise((resolve) => setTimeout(resolve, 20))
        return HttpResponse.json({ accessToken: "fresh-token" })
      }),
      http.get(`${API}/projects`, ({ request }) => {
        const authorization = request.headers.get("authorization")
        if (authorization !== "Bearer fresh-token") {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        return HttpResponse.json([])
      })
    )

    const responses = await Promise.all([
      apiClient.get("/projects"),
      apiClient.get("/projects"),
      apiClient.get("/projects")
    ])

    expect(refreshCount).toBe(1)
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(getAccessToken()).toBe("fresh-token")
  })

  it("clears the token and notifies listeners when the refresh itself fails", async () => {
    setAccessToken("expired-token")
    const onFailure = vi.fn()
    const unsubscribe = onAuthFailure(onFailure)

    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
      http.get(`${API}/projects`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 }))
    )

    await expect(apiClient.get("/projects")).rejects.toBeInstanceOf(ApiError)

    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    unsubscribe()
  })

  it("retries a request only once, so a still-401 response does not loop", async () => {
    let projectCalls = 0
    let refreshCount = 0
    setAccessToken("expired-token")

    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCount += 1
        return HttpResponse.json({ accessToken: "fresh-but-still-rejected" })
      }),
      http.get(`${API}/projects`, () => {
        projectCalls += 1
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
      })
    )

    await expect(apiClient.get("/projects")).rejects.toBeInstanceOf(ApiError)

    expect(projectCalls).toBe(2)
    expect(refreshCount).toBe(1)
  })

  it("does not attempt a refresh when login itself returns 401", async () => {
    let refreshCount = 0

    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCount += 1
        return HttpResponse.json({ accessToken: "unexpected" })
      }),
      http.post(`${API}/auth/login`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 }))
    )

    await expect(
      apiClient.post("/auth/login", { email: "a@b.com", password: "wrong-password" })
    ).rejects.toThrow()

    expect(refreshCount).toBe(0)
  })

  it("normalises the backend's validation payload into ApiError.fieldErrors", async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(
          {
            message: "Validation failed",
            fieldErrors: { email: ["Invalid email address"] },
            formErrors: []
          },
          { status: 400 }
        )
      )
    )

    const error = await apiClient.post("/auth/register", {}).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).fieldErrors.email).toEqual(["Invalid email address"])
  })
})
