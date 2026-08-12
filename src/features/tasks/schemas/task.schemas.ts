import { z } from "zod"

/**
 * Mirrors the backend's `create-task.schema.ts` / `.partial()` update variant.
 *
 * Form values are all strings, because native selects and `<input type="date">` produce
 * strings and `""` is their natural "nothing selected" value. The string -> wire conversion
 * happens once, in each dialog's submit handler.
 */
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(255, "Title must be at most 255 characters."),
  description: z.string().trim().max(1000, "Description must be at most 1000 characters."),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string(),
  dueDate: z.string()
})

export type TaskInput = z.infer<typeof taskSchema>
