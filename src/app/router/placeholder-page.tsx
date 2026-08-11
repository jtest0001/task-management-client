import { EmptyState } from "@/components/empty-state"

/**
 * Temporary stand-in for routes whose features land in Phases 4–8. Each is replaced by the
 * real screen when that phase is built; nothing else depends on this file.
 *
 * Rendered beneath `ProjectWorkspaceLayout`, which already owns the page's `<h1>` (the
 * project name) — this heading is one level down.
 */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col gap-6 px-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <EmptyState title="Not built yet" description={`This screen arrives in ${phase}.`} />
    </div>
  )
}
