import { z } from "zod"

export const labelFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a six-digit hex color, e.g. #0A7F78")
})

export type LabelFormValues = z.infer<typeof labelFormSchema>
