import { setupServer } from "msw/node"

/**
 * No default handlers: `onUnhandledRequest: "error"` plus per-test handlers means a test can
 * never accidentally pass against a request nobody declared.
 */
export const server = setupServer()
