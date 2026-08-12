import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router"

const PLACEHOLDER_INITIALS = ["B", "C", "D"]

/** Sits pinned to the bottom of the project rail — nudges solo users toward inviting members. */
export function InviteTeammatesCard({ projectId }: { projectId: string }) {
  const navigate = useNavigate()

  return (
    <div className="border-brand/35 bg-invite-card mt-auto rounded-xl border p-3.5">
      <p className="text-sm leading-normal font-semibold text-teal-900">Working alone?</p>
      <p className="mt-0.5 text-xs leading-normal text-teal-800">
        Add teammates by email — they join as members and can pick up tasks right away.
      </p>

      <div className="mt-2.5 flex items-center">
        {PLACEHOLDER_INITIALS.map((initial, index) => (
          <span
            key={initial}
            className={cn(
              "bg-background grid size-6 place-items-center rounded-full border-2 border-teal-50 text-[0.625rem] font-semibold text-teal-700 uppercase",
              index > 0 && "-ml-2"
            )}
          >
            {initial}
          </span>
        ))}
      </div>

      <Button
        type="button"
        className="mt-3 w-full text-sm"
        onClick={() => navigate(`/projects/${projectId}/members`)}
      >
        Invite a teammate
      </Button>
    </div>
  )
}
