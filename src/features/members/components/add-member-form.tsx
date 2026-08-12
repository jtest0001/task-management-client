import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAddMember } from "@/features/members/api/members.mutations"
import { addMemberSchema, type AddMemberInput } from "@/features/members/schemas/member.schemas"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"
import { toApiError } from "@/lib/api/errors"

const MEMBER_ADD_MESSAGES: Record<number, string> = {
  404: "No account uses that email address.",
  409: "They're already a member of this project."
}

export function AddMemberForm({ projectId }: { projectId: string }) {
  const addMember = useAddMember(projectId)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "" }
  })

  const emailId = useId()
  const errorId = useId()
  const hintId = useId()

  const submit = async (values: AddMemberInput) => {
    try {
      await addMember.mutateAsync(values.email)
      reset({ email: "" })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 404 || apiError.status === 409) {
        setError("email", { message: MEMBER_ADD_MESSAGES[apiError.status] })
        return
      }
      applyApiErrors(error, setError, ["email"])
    }
  }

  return (
    <form noValidate className="flex flex-col gap-1.5" onSubmit={handleSubmit(submit)}>
      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-sm">
          <Label htmlFor={emailId}>Add a member</Label>
          <Input
            id={emailId}
            type="email"
            placeholder="teammate@example.com"
            className="bg-background"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId : hintId}
            {...register("email")}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Adding…" : "Add member"}
        </Button>
      </div>

      {errors.email ? (
        <p id={errorId} className="text-destructive text-sm">
          {errors.email.message}
        </p>
      ) : (
        <p id={hintId} className="text-muted-foreground text-xs">
          They'll join as a member — you can promote them afterwards.
        </p>
      )}
    </form>
  )
}
