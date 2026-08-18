import { fileURLToPath, URL } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import svgr from "vite-plugin-svgr"

// The dev server deliberately does NOT proxy the API.
//
// The backend mounts every route under `/api` and scopes its refresh cookie to
// `Path=/api/auth`. A dev proxy would have to preserve that exact path to keep the cookie
// working, which buys nothing locally: talking to http://localhost:3000/api directly keeps
// the path (and therefore the cookie) intact, and the backend already allows this origin
// with `credentials: true`. In production that same path is preserved by the Vercel rewrite.
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
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
