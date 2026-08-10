import { ChevronDownIcon, LogOutIcon } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/auth-context"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const initial = user?.email.charAt(0).toUpperCase() ?? "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 rounded-full pr-2.5 pl-1" aria-label="Account menu">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 uppercase"
          >
            {initial}
          </span>
          <span className="hidden max-w-36 truncate text-sm font-normal sm:inline">{user?.email ?? "…"}</span>
          <ChevronDownIcon aria-hidden className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">
          <span className="text-muted-foreground block text-xs">Signed in as</span>
          {user?.email ?? "…"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={async () => {
            setIsSigningOut(true)
            await logout()
            navigate("/login", { replace: true })
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
