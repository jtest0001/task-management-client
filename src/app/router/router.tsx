import { Navigate, Route, Routes } from "react-router"

import { AppShell } from "@/app/layout/app-shell"
import { NotFoundPage } from "@/app/router/not-found-page"
import { PlaceholderPage } from "@/app/router/placeholder-page"
import { RedirectIfAuthenticated } from "@/features/auth/components/redirect-if-authenticated"
import { RequireAuth } from "@/features/auth/components/require-auth"
import { LoginPage } from "@/features/auth/pages/login-page"
import { RegisterPage } from "@/features/auth/pages/register-page"

/**
 * Page URLs are a navigation concern and deliberately do not mirror the REST routes — the
 * task detail page lives at `/projects/:projectId/tasks/:taskId` while fetching from
 * `GET /tasks/:taskId`, because the UI needs the project for its surrounding chrome.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects" phase="Phase 3" />} />
          <Route
            path="/projects/:projectId/tasks"
            element={<PlaceholderPage title="Tasks" phase="Phase 4" />}
          />
          <Route
            path="/projects/:projectId/tasks/:taskId"
            element={<PlaceholderPage title="Task detail" phase="Phase 5" />}
          />
          <Route
            path="/projects/:projectId/members"
            element={<PlaceholderPage title="Members" phase="Phase 7" />}
          />
          <Route
            path="/projects/:projectId/labels"
            element={<PlaceholderPage title="Labels" phase="Phase 8" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
