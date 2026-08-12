import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { commentFormSchema, type CommentFormValues } from "@/features/comments/schemas/comment.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

interface CommentFormProps {
  defaultValue?: string
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: CommentFormValues) => Promise<void>
  onCancel?: () => void
  autoFocus?: boolean
}

/** Shared by the composer and inline editing — the bar CLAUDE.md sets for an abstraction. */
export function CommentForm({
  defaultValue = "",
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  autoFocus
}: CommentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: defaultValue }
  })

  const contentId = useId()
  const errorId = useId()

  const submit = async (values: CommentFormValues) => {
    try {
      await onSubmit(values)
      reset({ content: "" })
    } catch (error) {
      applyApiErrors(error, setError, ["content"])
    }
  }

  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={handleSubmit(submit)}>
      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <label htmlFor={contentId} className="sr-only">
        Comment
      </label>
      <Textarea
        id={contentId}
        placeholder="Add a comment…"
        autoFocus={autoFocus}
        aria-invalid={Boolean(errors.content)}
        aria-describedby={errors.content ? errorId : undefined}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault()
            handleSubmit(submit)()
          }
        }}
        {...register("content")}
      />
      {errors.content ? (
        <p id={errorId} className="text-destructive text-sm">
          {errors.content.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
