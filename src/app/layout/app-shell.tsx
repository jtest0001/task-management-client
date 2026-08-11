import { Outlet } from "react-router"

import { UserMenu } from "@/app/layout/user-menu"
import { Logo } from "@/components/logo"
import { ProjectNav } from "@/features/projects/components/project-nav"

/** The persistent frame around every signed-in screen: a slim top bar and a sidebar slot. */
export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <Logo />
        <UserMenu />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-background w-full shrink-0 md:w-64 md:border-r">
          <ProjectNav />
        </aside>
        <main className="min-w-0 flex-1 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
