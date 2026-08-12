import { z } from "zod"

export const addMemberSchema = z.object({
  email: z.string().trim().pipe(z.email())
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
