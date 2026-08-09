import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { toApiError } from "@/lib/api/errors"

/**
 * Routes a failed request onto a React Hook Form.
 *
 * The backend's Zod handler returns `fieldErrors` keyed by field name, which map straight
 * onto inputs. Anything it could not attribute to a field (`formErrors`, or a plain
 * `{ message }` from a 401/409/500) becomes a form-level `root` error.
 *
 * @param fields the form fields eligible to receive a server message — an allow-list, so a
 *   stray key in the response cannot call `setError` on a field that does not exist.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
) {
  const apiError = toApiError(error)

  let attributedToField = false
  for (const field of fields) {
    const messages = apiError.fieldErrors[field]
    if (messages?.length) {
      setError(field, { message: messages.join(" ") })
      attributedToField = true
    }
  }

  const formMessage = apiError.formErrors.join(" ") || (attributedToField ? "" : apiError.message)
  if (formMessage) {
    setError("root", { message: formMessage })
  }

  return apiError
}
