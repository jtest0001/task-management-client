import { z } from "zod"

/** Mirrors the backend's `create-project.schema.ts` / `.partial()` update variant. */
export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(255, "Name must be at most 255 characters."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters.")
    .optional()
    .or(z.literal(""))
})

export type ProjectInput = z.infer<typeof projectSchema>
