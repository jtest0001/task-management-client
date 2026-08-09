import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll } from "vitest"

import { installInterceptors } from "@/lib/api/interceptors"
import { resetRefreshState } from "@/lib/api/refresh"
import { setAccessToken } from "@/lib/api/token-store"
import { server } from "@/test/msw/server"

// Same interceptor stack the app runs with — tests exercise the real refresh behaviour
// rather than a stand-in.
installInterceptors()

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  setAccessToken(null)
  resetRefreshState()
})

afterAll(() => {
  server.close()
})
