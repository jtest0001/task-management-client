import { Link, useNavigate } from "react-router"

import { useAuth } from "@/features/auth/auth-context"
import { AuthCard } from "@/features/auth/components/auth-card"
import { CredentialsForm } from "@/features/auth/components/credentials-form"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start organising work in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-foreground font-medium underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <CredentialsForm
        submitLabel="Create account"
        autoCompletePassword="new-password"
        passwordHint="At least 8 characters."
        onSubmit={async (values, form) => {
          try {
            await register(values)
            navigate("/projects", { replace: true })
          } catch (error) {
            const apiError = applyApiErrors(error, form.setError, ["email", "password"])

            // A duplicate email comes back as a bare 409 with no `fieldErrors`, so
            // applyApiErrors puts it at form level. It is unambiguously about the email.
            if (apiError.status === 409) {
              form.clearErrors("root")
              form.setError("email", { message: "That email is already registered." })
            }
          }
        }}
      />
    </AuthCard>
  )
}
