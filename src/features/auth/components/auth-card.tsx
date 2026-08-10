import type { ReactNode } from "react"
import { Link } from "react-router"

import illustrationTasks from "@/assets/illustration-tasks.svg"

interface AuthAsideContent {
  title: string
  body: string
  points: string[]
}

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  aside: AuthAsideContent
}

export function AuthCard({ title, subtitle, children, footer, aside }: AuthCardProps) {
  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden bg-teal-50 px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="bg-teal-900 absolute inset-y-0 right-0 left-1/2 -z-20 max-lg:hidden"
      />
      <div aria-hidden="true" className="bg-auth-glow absolute inset-0 -z-10" />

      <div className="bg-card shadow-xl grid w-full max-w-3xl overflow-hidden rounded-xl lg:grid-cols-[0.85fr_1fr]">
        <section className="flex flex-col px-6 py-10 sm:px-9">
          <Link
            to="/"
            className="text-foreground inline-flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="M2.5 8.5l3 3 8-8" />
              </svg>
            </span>
            Taskly
          </Link>

          <h1 className="mt-7 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <p className="text-muted-foreground border-border mt-7 border-t pt-5 text-sm">{footer}</p>
        </section>

        <aside className="bg-auth-aside relative flex flex-col p-8 max-lg:hidden">
          <div className="ml-auto max-w-72 text-right">
            <p className="text-teal-900 text-sm font-semibold">{aside.title}</p>
            <p className="text-teal-800 mt-1 text-sm">{aside.body}</p>
          </div>

          <img className="mt-auto w-full" src={illustrationTasks} alt="" />

          <ul className="mt-5 flex flex-col gap-2">
            {aside.points.map((point) => (
              <li key={point} className="text-teal-800 flex items-center gap-2 text-sm">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="stroke-teal-600 size-4 shrink-0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
