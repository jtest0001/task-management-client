import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useState, type ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"

import { DatePicker } from "@/components/date-picker"
import { NativeSelect } from "@/components/native-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMembers } from "@/features/members/api/members.queries"
import { taskSchema, type TaskInput } from "@/features/tasks/schemas/task.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

interface TaskFormDialogProps {
  projectId: string
  trigger: ReactNode
  title: string
  description: string
  submitLabel: string
  submittingLabel: string
  defaultValues: TaskInput
  /** Throwing is expected: applyApiErrors renders the message and the dialog stays open. */
  onSubmit: (values: TaskInput) => Promise<void>
}

/** Shared by create and edit — same fields, same validation, same assignee-400 handling. */
export function TaskFormDialog({
  projectId,
  trigger,
  title,
  description,
  submitLabel,
  submittingLabel,
  defaultValues,
  onSubmit
}: TaskFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: members, isPending: membersPending, isError: membersError } = useMembers(projectId)

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = form

  const titleId = useId()
  const descriptionId = useId()
  const descriptionHintId = useId()
  const statusId = useId()
  const priorityId = useId()
  const assigneeId = useId()
  const assigneeHintId = useId()
  const dueDateId = useId()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    reset(defaultValues)
  }

  const submit = async (values: TaskInput) => {
    try {
      await onSubmit(values)
      setOpen(false)
      reset(defaultValues)
    } catch (error) {
      const apiError = applyApiErrors(error, form.setError, ["title", "description"])

      // The only 400 the form can provoke that isn't a Zod `fieldErrors` response is a
      // non-member assignee, so match on status rather than the message text.
      if (apiError.status === 400 && Object.keys(apiError.fieldErrors).length === 0) {
        form.clearErrors("root")
        form.setError("assigneeId", { message: "The selected assignee is not a member of this project." })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form noValidate className="flex flex-col gap-3.5" onSubmit={handleSubmit(submit)}>
          {errors.root ? (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              placeholder="Write the release notes"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              {...register("title")}
            />
            {errors.title ? (
              <p id={`${titleId}-error`} className="text-destructive text-sm">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              placeholder="What needs to happen?"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? `${descriptionId}-error` : descriptionHintId}
              {...register("description")}
            />
            {errors.description ? (
              <p id={`${descriptionId}-error`} className="text-destructive text-sm">
                {errors.description.message}
              </p>
            ) : (
              <p id={descriptionHintId} className="text-muted-foreground text-sm">
                Optional, up to 1000 characters.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={statusId}>Status</Label>
              <NativeSelect id={statusId} {...register("status")}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={priorityId}>Priority</Label>
              <NativeSelect id={priorityId} {...register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </NativeSelect>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={assigneeId}>Assignee</Label>
            <NativeSelect
              id={assigneeId}
              disabled={membersPending || membersError}
              aria-invalid={Boolean(errors.assigneeId)}
              aria-describedby={errors.assigneeId ? `${assigneeId}-error` : assigneeHintId}
              {...register("assigneeId")}
            >
              <option value="">Unassigned</option>
              {members?.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.email}
                </option>
              ))}
            </NativeSelect>
            {errors.assigneeId ? (
              <p id={`${assigneeId}-error`} className="text-destructive text-sm">
                {errors.assigneeId.message}
              </p>
            ) : membersError ? (
              <p id={assigneeHintId} className="text-muted-foreground text-sm">
                Couldn't load members, so assignment is unavailable right now.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={dueDateId}>Due date</Label>
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  id={dueDateId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
