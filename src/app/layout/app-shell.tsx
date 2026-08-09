import { Outlet } from "react-router"

import { UserMenu } from "@/app/layout/user-menu"

/**
 * The persistent frame around every signed-in screen: a slim top bar and a sidebar slot.
 *
 * The sidebar is intentionally empty until Phase 3 puts the project list in it — the shape
 * is here, the content arrives with the feature that owns it.
 */
export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <span className="text-sm font-semibold tracking-tight">Taskly</span>
        <UserMenu />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden w-60 shrink-0 border-r md:block" aria-label="Projects" />
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
