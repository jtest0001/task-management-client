import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRemoveMember } from "@/features/members/api/members.mutations"
import { toApiError } from "@/lib/api/errors"
import type { Member } from "@/features/members/api/members.api"

interface RemoveMemberDialogProps {
  projectId: string
  member: Member
  onRemoved?: () => void
}

export function RemoveMemberDialog({ projectId, member, onRemoved }: RemoveMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const removeMember = useRemoveMember(projectId)

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync(member.user.id)
      setOpen(false)
      setTimeout(() => onRemoved?.())
    } catch (error) {
      setOpen(false)
      toast.error(toApiError(error).message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member.user.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {member.user.email} from this project? Any tasks assigned to them will become unassigned.
            They'll lose access immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={removeMember.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleRemove()
            }}
          >
            {removeMember.isPending ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
