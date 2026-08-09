import { AxiosError } from "axios"

/** Field-level messages from the backend's Zod handler, keyed by field name. */
export type FieldErrors = Record<string, string[]>

interface BackendErrorBody {
  message?: string
  fieldErrors?: FieldErrors
  formErrors?: string[]
}

/**
 * Normalised transport error. Every error surfaced to the UI is one of these, so components
 * never have to know about axios.
 *
 * The backend's contract (see docs/frontend-api-contract.md):
 *   400 `{ message: "Validation failed", fieldErrors, formErrors }` or `{ message }`
 *   401 / 403 / 404 / 409 / 500 `{ message }`
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors
  readonly formErrors: string[]

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}, formErrors: string[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
    this.formErrors = formErrors
  }

  /** True when the request never reached the server (offline, DNS, CORS preflight failure). */
  get isNetworkError() {
    return this.status === 0
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "Could not reach the server. Check your connection and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "That resource could not be found.",
  409: "That conflicts with something that already exists.",
  500: "Something went wrong on our end. Please try again."
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as BackendErrorBody | undefined

    return new ApiError(
      status,
      body?.message ?? FALLBACK_MESSAGES[status] ?? "Unexpected error.",
      body?.fieldErrors ?? {},
      body?.formErrors ?? []
    )
  }

  return new ApiError(0, error instanceof Error ? error.message : "Unexpected error.")
}
