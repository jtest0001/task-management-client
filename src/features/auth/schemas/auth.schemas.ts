import { z } from "zod"

/**
 * Mirrors the backend's `LoginSchema` / `RegisterSchema` (email + password 8–72). These exist
 * for fast feedback and typed form values only — the server revalidates everything.
 *
 * The 72-character ceiling is not arbitrary: bcrypt silently truncates beyond 72 bytes, so
 * the backend rejects longer passwords rather than accept one it would not fully hash.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters.")
})

export type CredentialsInput = z.infer<typeof credentialsSchema>
