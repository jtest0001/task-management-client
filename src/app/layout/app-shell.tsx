import { MenuIcon } from "lucide-react"
import { useState } from "react"
import { Outlet } from "react-router"

import { UserMenu } from "@/app/layout/user-menu"
import { RouteFocusProvider } from "@/app/router/route-focus"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ProjectNav } from "@/features/projects/components/project-nav"

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="bg-background text-foreground focus-visible:ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow-md focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:ring-3 focus-visible:outline-none"
      >
        Skip to content
      </a>

      <header className="bg-background flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open project menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon aria-hidden="true" />
          </Button>
          <Logo />
        </div>
        <UserMenu />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-background hidden shrink-0 md:block md:w-64 md:border-r">
          <ProjectNav />
        </aside>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-3/4 gap-0 p-0 md:hidden" showCloseButton={false}>
            <SheetHeader className="sr-only">
              <SheetTitle>Projects</SheetTitle>
              <SheetDescription>Jump to a project or manage the current one.</SheetDescription>
            </SheetHeader>
            <ProjectNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <RouteFocusProvider>
          <main id="main-content" className="min-w-0 flex-1 py-6">
            <Outlet />
          </main>
        </RouteFocusProvider>
      </div>
    </div>
  )
}
