import { EmptyState } from "@/components/empty-state"

/**
 * Temporary stand-in for routes whose features land in Phases 3–8. Each is replaced by the
 * real screen when that phase is built; nothing else depends on this file.
 */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <EmptyState title="Not built yet" description={`This screen arrives in ${phase}.`} />
    </div>
  )
}
