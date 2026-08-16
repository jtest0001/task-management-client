import type { ReactNode } from "react"

import tasklyIllustration from "@/assets/taskly-illustration.webp"
import { Logo } from "@/components/logo"

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
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden bg-teal-50 px-4 py-10 sm:px-6 dark:bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 left-1/2 -z-20 bg-teal-900 max-lg:hidden"
      />
      <div aria-hidden="true" className="bg-auth-glow absolute inset-0 -z-10" />

      <div className="bg-card grid w-full max-w-4xl overflow-hidden rounded-xl shadow-xl lg:grid-cols-2">
        <section className="flex flex-col px-6 py-10 sm:px-9">
          <Logo size="lg" />

          <h1 className="mt-7 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <p className="text-muted-foreground border-border mt-7 border-t pt-5 text-sm">{footer}</p>
        </section>

        <aside className="bg-auth-aside relative flex flex-col p-8 max-lg:hidden">
          <div className="ml-auto max-w-72 text-right">
            <p className="text-sm font-semibold text-teal-900">{aside.title}</p>
            <p className="mt-1 text-sm text-teal-800">{aside.body}</p>
          </div>

          <img className="mt-auto w-full" src={tasklyIllustration} alt="" />

          <ul className="mt-5 flex flex-col gap-2">
            {aside.points.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-teal-800">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-4 shrink-0 stroke-teal-600"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                </svg>
                {""}
                {point}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
