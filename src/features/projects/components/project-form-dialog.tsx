import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"

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
import { projectSchema, type ProjectInput } from "@/features/projects/schemas/project.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

interface ProjectFormDialogProps {
  trigger: ReactNode
  title: string
  description: string
  submitLabel: string
  submittingLabel: string
  defaultValues: ProjectInput
  /** Throwing is expected: applyApiErrors renders the message and the dialog stays open. */
  onSubmit: (values: ProjectInput) => Promise<void>
}

/** Shared by create and rename — same fields, same validation, same 409-on-name handling. */
export function ProjectFormDialog({
  trigger,
  title,
  description,
  submitLabel,
  submittingLabel,
  defaultValues,
  onSubmit
}: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = form

  const nameId = useId()
  const nameHintId = useId()
  const descriptionId = useId()
  const descriptionHintId = useId()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    reset(defaultValues)
  }

  const submit = async (values: ProjectInput) => {
    try {
      await onSubmit(values)
      setOpen(false)
      reset(defaultValues)
    } catch (error) {
      const apiError = applyApiErrors(error, form.setError, ["name", "description"])

      // A duplicate name comes back as a bare 409 with no `fieldErrors`, so applyApiErrors
      // puts it at form level. It is unambiguously about the name.
      if (apiError.status === 409) {
        form.clearErrors("root")
        form.setError("name", { message: "You already have a project with this name." })
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
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              placeholder="Website Redesign"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${nameId}-error` : nameHintId}
              {...register("name")}
            />
            {errors.name ? (
              <p id={`${nameId}-error`} className="text-destructive text-sm">
                {errors.name.message}
              </p>
            ) : (
              <p id={nameHintId} className="text-muted-foreground text-sm">
                1–255 characters, unique among your projects.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              placeholder="What is this project for?"
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
                Optional, up to 5000 characters.
              </p>
            )}
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
