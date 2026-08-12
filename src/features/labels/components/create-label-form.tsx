import { zodResolver } from "@hookform/resolvers/zod"
import { forwardRef, useId, useImperativeHandle } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/features/labels/components/color-field"
import { useCreateLabel } from "@/features/labels/api/labels.mutations"
import { labelFormSchema, type LabelFormValues } from "@/features/labels/schemas/label.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

const DEFAULT_VALUES: LabelFormValues = { name: "", color: "#0A7F78" }

export interface CreateLabelFormHandle {
  focusName: () => void
}

/** The OWNER/ADMIN empty state's "New label" action focuses the name field via this handle. */
export const CreateLabelForm = forwardRef<CreateLabelFormHandle, { projectId: string }>(
  function CreateLabelForm({ projectId }, handle) {
    const createLabel = useCreateLabel(projectId)
    const {
      register,
      control,
      handleSubmit,
      reset,
      setError,
      clearErrors,
      setFocus,
      formState: { errors, isSubmitting }
    } = useForm<LabelFormValues>({
      resolver: zodResolver(labelFormSchema),
      defaultValues: DEFAULT_VALUES
    })

    useImperativeHandle(handle, () => ({ focusName: () => setFocus("name") }))

    const nameId = useId()
    const nameErrorId = useId()
    const colorId = useId()
    const colorErrorId = useId()
    const hintId = useId()

    const submit = async (values: LabelFormValues) => {
      try {
        await createLabel.mutateAsync(values)
        reset(DEFAULT_VALUES)
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
      <form noValidate className="flex flex-col gap-2" onSubmit={handleSubmit(submit)}>
        {errors.root ? (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm sm:min-w-56">
            <Label htmlFor={nameId}>Label name</Label>
            <Input
              id={nameId}
              placeholder="Frontend"
              className="bg-background"
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

          <div className="flex flex-col gap-1.5 sm:w-48">
            <Label htmlFor={colorId}>Colour</Label>
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
                  aria-describedby={errors.color ? colorErrorId : hintId}
                />
              )}
            />
            {errors.color ? (
              <p id={colorErrorId} className="text-destructive text-sm">
                {errors.color.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Creating…" : "Create label"}
          </Button>
        </div>

        <p className="text-muted-foreground text-xs" id={hintId}>
          Six-character hex code, like #0A7F78. The colour swatch fills it in for you.
        </p>
      </form>
    )
  }
)
