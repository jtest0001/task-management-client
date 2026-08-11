import { NavLink } from "react-router"

import { cn } from "@/lib/utils"

const TABS = [
  { to: "tasks", label: "Tasks" },
  { to: "members", label: "Members" },
  { to: "labels", label: "Labels" }
] as const

/** Tab state is the URL — real `NavLink`s, not Radix `Tabs`, so there is one source of truth. */
export function ProjectTabs() {
  return (
    <nav aria-label="Project sections" className="border-border flex gap-1 border-b px-6">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium",
              isActive && "border-primary text-primary hover:text-primary"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
