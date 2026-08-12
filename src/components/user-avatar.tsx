function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase()
}

export function UserAvatar({ email, className }: { email: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 uppercase ${className ?? ""}`}
    >
      {initials(email)}
    </span>
  )
}
