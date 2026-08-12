import { Button } from "@/components/ui/button"
import type { Task, UpdateTaskInput } from "@/features/tasks/api/tasks.api"
import { useUpdateTask } from "@/features/tasks/api/tasks.mutations"
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog"
import { fromApiDate, toApiDate } from "@/lib/utils/date"

export function EditTaskDialog({ task }: { task: Task }) {
  const updateTask = useUpdateTask(task.id, task.projectId)

  const defaultValues = {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ?? "",
    dueDate: task.dueDate ? fromApiDate(task.dueDate) : ""
  }

  return (
    <TaskFormDialog
      projectId={task.projectId}
      trigger={
        <Button variant="outline" size="sm">
          Edit task
        </Button>
      }
      title="Edit task"
      description="Update the task's details."
      submitLabel="Save changes"
      submittingLabel="Saving…"
      defaultValues={defaultValues}
      onSubmit={async (values) => {
        // `PATCH` rejects `{}` — send only fields that actually changed.
        const patch: UpdateTaskInput = {}
        if (values.title !== defaultValues.title) patch.title = values.title

        const nextDescription = values.description
        if (nextDescription !== defaultValues.description) patch.description = nextDescription

        if (values.status !== defaultValues.status) patch.status = values.status
        if (values.priority !== defaultValues.priority) patch.priority = values.priority

        if (values.assigneeId !== defaultValues.assigneeId) {
          patch.assigneeId = values.assigneeId || null
        }

        if (values.dueDate !== defaultValues.dueDate) {
          patch.dueDate = values.dueDate ? toApiDate(values.dueDate) : null
        }

        if (Object.keys(patch).length === 0) return
        await updateTask.mutateAsync(patch)
      }}
    />
  )
}
