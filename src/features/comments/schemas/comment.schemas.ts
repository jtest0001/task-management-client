import { z } from "zod"

export const commentFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be 5000 characters or fewer")
})

export type CommentFormValues = z.infer<typeof commentFormSchema>
