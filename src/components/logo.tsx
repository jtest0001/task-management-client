import { Link } from "react-router"

import { cn } from "@/lib/utils"

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
      <span
        aria-hidden
        className={cn(
          "bg-primary text-primary-foreground grid shrink-0 place-items-center rounded-lg",
          size === "lg" ? "size-9" : "size-7"
        )}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={size === "lg" ? "size-5" : "size-4"}
        >
          <path d="M2.5 8.5l3 3 8-8" />
        </svg>
      </span>
      {""}
      Taskly
    </Link>
  )
}
