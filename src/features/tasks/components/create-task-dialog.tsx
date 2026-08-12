import { Button } from "@/components/ui/button"
import { useCreateTask } from "@/features/tasks/api/tasks.mutations"
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog"
import { toApiDate } from "@/lib/utils/date"
import { Plus } from "lucide-react"

export function CreateTaskDialog({ projectId }: { projectId: string }) {
  const createTask = useCreateTask(projectId)

  return (
    <TaskFormDialog
      projectId={projectId}
      trigger={
        <Button>
          <Plus />
          <span>Add task</span>
        </Button>
      }
      title="New task"
      description="Add a task to this project."
      submitLabel="Create task"
      submittingLabel="Creating…"
      defaultValues={{
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: ""
      }}
      onSubmit={async (values) => {
        await createTask.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          assigneeId: values.assigneeId || undefined,
          dueDate: values.dueDate ? toApiDate(values.dueDate) : undefined
        })
      }}
    />
  )
}
