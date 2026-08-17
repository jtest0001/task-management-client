import { useRef, useState } from "react"

import { BusyRegion } from "@/components/busy-region"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useComments } from "@/features/comments/api/comments.queries"
import { useCreateComment } from "@/features/comments/api/comments.mutations"
import { CommentForm } from "@/features/comments/components/comment-form"
import { CommentItem } from "@/features/comments/components/comment-item"
import { toApiError } from "@/lib/api/errors"

const COMMENTS_COLLAPSED = 5

interface CommentsSectionProps {
  taskId: string
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const { data, isPending, isError, error } = useComments(taskId)
  const createComment = useCreateComment(taskId)
  const headingRef = useRef<HTMLHeadingElement>(null)

  if (isPending) {
    return (
      <section>
        <h3 className="text-sm font-semibold">Comments</h3>
        <BusyRegion label="Loading comments" className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </BusyRegion>
      </section>
    )
  }

  if (isError) {
    return (
      <section>
        <h3 className="text-sm font-semibold">Comments</h3>
        <div role="alert" className="mt-2 text-sm">
          {toApiError(error).message}
        </div>
      </section>
    )
  }

  const comments = data.data
  const visible =
    comments.length > COMMENTS_COLLAPSED && !expanded ? comments.slice(-COMMENTS_COLLAPSED) : comments

  return (
    <section>
      <h3 ref={headingRef} tabIndex={-1} className="text-sm font-semibold outline-none">
        Comments
      </h3>

      {comments.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">No comments yet.</p>
      ) : (
        <>
          {comments.length > COMMENTS_COLLAPSED ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              className="mt-2 h-auto p-0 text-xs font-normal"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Show fewer" : `Show all ${comments.length} comments`}
            </Button>
          ) : null}

          <ol className="mt-2 flex flex-col gap-4">
            {visible.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                taskId={taskId}
                onCommentDeleted={() => headingRef.current?.focus()}
              />
            ))}
          </ol>

          {data.pagination.total > comments.length ? (
            <p className="text-muted-foreground mt-2 text-xs">Showing the first 100 comments.</p>
          ) : null}
        </>
      )}

      <div className="mt-3">
        <CommentForm
          submitLabel="Comment"
          submittingLabel="Posting…"
          onSubmit={async (values) => {
            await createComment.mutateAsync(values)
          }}
        />
      </div>
    </section>
  )
}
