import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
import { Label as FieldLabel } from "@/components/ui/label"
import { ColorField } from "@/features/labels/components/color-field"
import { useUpdateLabel } from "@/features/labels/api/labels.mutations"
import { labelFormSchema, type LabelFormValues } from "@/features/labels/schemas/label.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"
import type { Label } from "@/features/labels/api/labels.api"

export function EditLabelDialog({ label, projectId }: { label: Label; projectId: string }) {
  const [open, setOpen] = useState(false)
  const updateLabel = useUpdateLabel(label.id, projectId)

  const defaultValues: LabelFormValues = { name: label.name, color: label.color }
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<LabelFormValues>({ resolver: zodResolver(labelFormSchema), defaultValues })

  const nameId = useId()
  const nameErrorId = useId()
  const colorId = useId()
  const colorErrorId = useId()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    reset(defaultValues)
  }

  const submit = async (values: LabelFormValues) => {
    // PATCH rejects `{}` — send only fields that actually changed, same rule as edit-project-dialog.
    const patch: Partial<LabelFormValues> = {}
    if (values.name !== label.name) patch.name = values.name
    if (values.color !== label.color) patch.color = values.color

    if (Object.keys(patch).length === 0) {
      setOpen(false)
      return
    }

    try {
      await updateLabel.mutateAsync(patch)
      setOpen(false)
    } catch (error) {
      const apiError = applyApiErrors(error, setError, ["name", "color"])
      // A duplicate name comes back as a bare 409 with no `fieldErrors`, so applyApiErrors put
      // it at form level. It is unambiguously about the name.
      if (apiError.status === 409) {
        clearErrors("root")
        setError("name", { message: "A label with this name already exists in this project." })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit ${label.name}`}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit label</DialogTitle>
          <DialogDescription>Rename this label or change its colour.</DialogDescription>
        </DialogHeader>

        <form noValidate className="flex flex-col gap-3.5" onSubmit={handleSubmit(submit)}>
          {errors.root ? (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={nameId}>Name</FieldLabel>
            <Input
              id={nameId}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? nameErrorId : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p id={nameErrorId} className="text-destructive text-sm">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={colorId}>Colour</FieldLabel>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorField
                  id={colorId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.color)}
                  aria-describedby={errors.color ? colorErrorId : undefined}
                />
              )}
            />
            {errors.color ? (
              <p id={colorErrorId} className="text-destructive text-sm">
                {errors.color.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
