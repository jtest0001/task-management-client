import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { credentialsSchema, type CredentialsInput } from "@/features/auth/schemas/auth.schemas"

interface CredentialsFormProps {
  submitLabel: string
  /** Rejecting is expected: throw and the form renders the message. */
  onSubmit: (values: CredentialsInput, form: ReturnType<typeof useForm<CredentialsInput>>) => Promise<void>
  autoCompletePassword: "current-password" | "new-password"
  passwordHint?: string
}

export function CredentialsForm({
  submitLabel,
  onSubmit,
  autoCompletePassword,
  passwordHint
}: CredentialsFormProps) {
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" }
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = form

  const emailId = useId()
  const passwordId = useId()
  const hintId = useId()

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => onSubmit(values, form))}
    >
      {errors.root ? (
        <p role="alert" className="text-destructive rounded-md border border-current/25 px-3 py-2 text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="text-destructive text-sm">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete={autoCompletePassword}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            [errors.password ? `${passwordId}-error` : null, passwordHint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...register("password")}
        />
        {passwordHint ? (
          <p id={hintId} className="text-muted-foreground text-sm">
            {passwordHint}
          </p>
        ) : null}
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-destructive text-sm">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : submitLabel}
      </Button>
    </form>
  )
}
