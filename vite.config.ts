import { fileURLToPath, URL } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// The dev server deliberately does NOT proxy the API.
//
// The backend scopes its refresh cookie to `Path=/auth`. Proxying through something like
// `/api/*` would make the browser's request path `/api/auth/refresh`, which does not match
// that cookie path, so the cookie would silently never be sent and every refresh would fail.
// Talking to http://localhost:3000 directly keeps the path (and therefore the cookie) intact;
// the backend already allows this origin with `credentials: true`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true
  }
})
