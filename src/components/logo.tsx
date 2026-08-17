import { Link } from "react-router"
import { cn } from "@/lib/utils"
import TasklyLogo from "@/assets/taskly-logo.svg?react"

interface LogoProps {
  /** `lg` is the auth-screen size; the default matches the app shell's topbar. */
  size?: "default" | "lg"
  className?: string
}

/** The teal checkmark wordmark — `design/app.html`'s `.wordmark` / `.wordmark--lg`. */
export function Logo({ size = "default", className }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        "text-foreground inline-flex items-center gap-2 font-bold tracking-tight",
        size === "lg" ? "text-xl" : "text-lg",
        className
      )}
    >
      <TasklyLogo className="size-9" />
      {""}
      Taskly
    </Link>
  )
}
