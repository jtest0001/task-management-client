import { useEffect, useRef, useState } from "react"

import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import type { Comment } from "@/features/comments/api/comments.api"
import { useUpdateComment } from "@/features/comments/api/comments.mutations"
import { CommentForm } from "@/features/comments/components/comment-form"
import { DeleteCommentDialog } from "@/features/comments/components/delete-comment-dialog"
import { useAuth } from "@/features/auth/auth-context"

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
})

interface CommentItemProps {
  comment: Comment
  taskId: string
  onCommentDeleted?: () => void
}

export function CommentItem({ comment, taskId, onCommentDeleted }: CommentItemProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const updateComment = useUpdateComment(comment.id, taskId)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditingRef = useRef(false)

  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      editButtonRef.current?.focus()
    }
    wasEditingRef.current = isEditing
  }, [isEditing])

  const isOwn = user?.id === comment.author.id
  const isEdited = comment.updatedAt !== comment.createdAt

  if (isEditing) {
    return (
      <li className="flex flex-col gap-2">
        <CommentForm
          defaultValue={comment.content}
          submitLabel="Save"
          submittingLabel="Saving…"
          autoFocus
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            if (values.content.trim() === comment.content.trim()) {
              setIsEditing(false)
              return
            }
            await updateComment.mutateAsync(values)
            setIsEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex gap-2.5">
      <UserAvatar email={comment.author.email} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{comment.author.email}</span>
          <time dateTime={comment.createdAt} className="text-muted-foreground text-xs">
            {dateTimeFormatter.format(new Date(comment.createdAt))}
          </time>
          {isEdited ? <span className="text-muted-foreground text-xs">(edited)</span> : null}
        </div>
        <p className="mt-0.5 text-sm wrap-break-word whitespace-pre-wrap">{comment.content}</p>
        {isOwn ? (
          <div className="mt-1 flex gap-1">
            <Button
              ref={editButtonRef}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <DeleteCommentDialog comment={comment} taskId={taskId} onDeleted={onCommentDeleted} />
          </div>
        ) : null}
      </div>
    </li>
  )
}
