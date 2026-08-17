# client-app

React frontend for `task-management-api` (sibling directory `../task-management-api`,
Express 5 + Prisma 6 + Postgres). A list-first project-management workspace: projects, tasks,
comments, members, labels.

**Read `docs/frontend-api-contract.md` before touching anything that talks to the API.** It is
derived from the backend source, not from docs, and records several shapes that are easy to
guess wrong.

## Commands

```bash
npm run dev         # :5173 — needs the backend on :3000
npm run typecheck
npm run lint
npm test            # add -- --run for CI-style single pass
npm run build
```

Backend: `cd ../task-management-api && npm run dev`, seed with `npm run db:seed`.
Seed accounts all use `Password123!` — `alice@example.com` (OWNER), `bob@example.com`
(ADMIN/OWNER), `charlie@example.com` (MEMBER/OWNER), `diana@example.com` (MEMBER),
`ethan@example.com` (no projects — empty-state case).

## Architecture

```
src/
├── app/          providers, router, layout shell
├── components/   shared UI; components/ui is vendored shadcn — do not hand-edit
├── features/     one folder per domain: auth, projects, tasks, comments, members, labels
├── lib/          api client, query client, forms, utils
└── types/        cross-feature domain types
```

Create feature subfolders when real files need them. No empty scaffolding.

### State ownership

- **Server state** → TanStack Query. Never copy it into `useState` or a global store.
- **Shareable list state** (page, filters, search, sort) → **URL search params**, single source
  of truth. Query keys derive from them.
- **Ephemeral UI state** (dialog open, dropdown) → local component state.
- No Redux. Add global client state only if something is genuinely none of the above.

### Authentication

- Access token lives in **module memory** (`lib/api/token-store.ts`), never `localStorage`.
- Refresh token is an **httpOnly cookie scoped to `Path=/auth`**, invisible to JS.
- Boot restores the session with one `POST /auth/refresh`; `AuthProvider` holds
  `pending | authenticated | unauthenticated`. **`pending` must never be treated as signed
  out** — that is what makes a reload flash the login page.
- Concurrent 401s share **one** in-flight refresh promise. The backend rotates refresh tokens,
  so parallel refreshes would race and log the user out.
- The axios layer reports session loss through `onAuthFailure` subscribers. **It must not
  import React Router or the query client.**

### Non-obvious constraints

- **No dev proxy for the API.** The refresh cookie is scoped to `Path=/auth`; proxying via
  `/api/*` would stop the browser sending it. Talk to `http://localhost:3000` directly.
- **Due dates**: date-only in the UI, full ISO datetime on the wire. Convert only through
  `lib/utils/date.ts`, which works in UTC so dates never shift a day.
- **Three response envelopes** coexist: `{ data, pagination }` (tasks, comments), `{ data }`
  (members), bare array (projects, labels). Type each endpoint honestly — no universal unwrap.
- **`:memberId` in member routes is the target's `user.id`**, not a membership row id.
- **Removing a member unassigns their tasks server-side** — invalidate task lists and any open
  task detail, not just the members query.
- Task responses carry **no assignee object and no labels**; join against the members query.

### Roles

Role comes from `GET /projects` (the sidebar query), which returns it per project.
Capability helpers (`canManageMembers(role)` etc.) exist for **UX only** — the backend is the
authorization boundary. Hiding a button is never a security control.

Backend rules worth mirroring: project edit/delete is **OWNER only**; label definitions are
OWNER/ADMIN; any member may create/update/delete **tasks** and attach/detach labels; only a
comment's author may edit or delete it.

## Conventions

- Cache correctness first: invalidate on mutation success. Reach for `setQueryData` or
  optimistic updates only where the UX measurably benefits.
- Query keys come from per-feature factories (`features/*/api/*.keys.ts`).
- Forms: React Hook Form + Zod, with `lib/forms/apply-api-errors.ts` mapping server
  `fieldErrors` onto inputs.
- Every collection needs deliberate loading, empty and error states — and an empty state must
  distinguish "nothing here yet" from "nothing matches your filters".
- Accessibility is part of the feature, not a later pass: real buttons, labelled inputs,
  keyboard-navigable dialogs, status never conveyed by colour alone.
- Prefer clarity over cleverness. No abstraction without a second real caller.
- Toasts are for a failure with no form or field to host the message — the destructive-action
  dialogs (delete project/task/comment/member/label), sign-out, and label attach/detach. Every
  other error renders inline next to what it's about (`ErrorState`, a field error, `role="alert"`
  text) instead. There are no success toasts: success is signalled by the thing itself changing,
  which is the right default for a list-first app — don't add one for a new mutation.
