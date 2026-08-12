import { z } from "zod"

export const addMemberSchema = z.object({
  email: z.email().trim()
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
