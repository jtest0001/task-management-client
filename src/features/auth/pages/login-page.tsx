import { Link, useLocation, useNavigate } from "react-router"

import { useAuth } from "@/features/auth/auth-context"
import { AuthCard } from "@/features/auth/components/auth-card"
import { CredentialsForm } from "@/features/auth/components/credentials-form"
import { applyApiErrors } from "@/lib/forms/apply-api-errors"

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Send the user back where they were headed before the guard intercepted them.
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/projects"

  return (
    <AuthCard
      title="Sign in"
      subtitle="Pick up where you left off."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-foreground font-medium underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      <CredentialsForm
        submitLabel="Sign in"
        autoCompletePassword="current-password"
        onSubmit={async (values, form) => {
          try {
            await login(values)
            navigate(redirectTo, { replace: true })
          } catch (error) {
            // The backend answers bad credentials with a generic 401 and no field errors,
            // deliberately not revealing whether the email exists. Keep it form-level.
            applyApiErrors(error, form.setError, ["email", "password"])
          }
        }}
      />
    </AuthCard>
  )
}
