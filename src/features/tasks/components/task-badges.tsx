import { cn } from "@/lib/utils"
import type { TaskPriority, TaskStatus } from "@/types/api"

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done"
}

const STATUS_CLASSES: Record<TaskStatus, string> = {
  TODO: "bg-status-todo-soft text-status-todo",
  IN_PROGRESS: "bg-status-progress-soft text-status-progress",
  DONE: "bg-status-done-soft text-status-done"
}

export function TaskStatusChip({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold",
        STATUS_CLASSES[status]
      )}
    >
      <span className="h-3.5 w-0.75 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High"
}

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  LOW: "bg-priority-low-soft text-priority-low",
  MEDIUM: "bg-priority-medium-soft text-priority-medium",
  HIGH: "bg-priority-high-soft text-priority-high"
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium whitespace-nowrap",
        PRIORITY_CLASSES[priority]
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
