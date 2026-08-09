import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { AppProviders } from "@/app/providers/app-providers"
import { AppRoutes } from "@/app/router/router"
import { installInterceptors } from "@/lib/api/interceptors"

import "./index.css"

// Attach the Bearer + refresh-on-401 behaviour before anything can make a request.
installInterceptors()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </StrictMode>
)
