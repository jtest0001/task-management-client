# Build roadmap

Working reference for building out the frontend. Companion documents:

- [`frontend-api-contract.md`](./frontend-api-contract.md) — verified API shapes. **Read before
  writing anything that talks to the backend.**
- [`../CLAUDE.md`](../CLAUDE.md) — conventions, state ownership, non-obvious constraints.

Update the status table as phases land.

---

## Status

| Phase                  | Scope                                           | Status      |
| ---------------------- | ----------------------------------------------- | ----------- |
| 0 — API contract audit | Read backend source, document real shapes       | ✅ Done     |
| 0.5 — Backend unblock  | Fix 3 blocking defects + seed                   | ✅ Done     |
| 1 — Foundation         | Tooling, API client, refresh flow, shell, tests | ✅ Done     |
| 2 — Authentication     | Register, login, logout, boot restore, guards   | ✅ Done     |
| 3 — Projects           | List, create, workspace shell, role plumbing    | ✅ Done     |
| 4 — Task list          | Filters, search, sort, pagination, URL state    | ✅ Done     |
| 5 — Task CRUD + detail | Create, detail route, edit, delete              | ✅ Done     |
| 6 — Comments           | List, create, edit/delete own                   | ✅ Done     |
| 7 — Members            | List, add by email, promote/demote, remove      | ✅ Done     |
| 8 — Labels + TaskLabel | Definitions CRUD, attach/detach                 | ✅ Done     |
| 9 — UX polish          | States, a11y, responsive, keyboard              | ✅ Done     |
| 10 — Test coverage     | Fill gaps, add E2E for critical flows           | ⬜          |
| 11 — Kanban (optional) | Board view, drag/drop, optimistic status        | ⬜ Deferred |

---

## ✅ Completed

### Phase 0 — API contract audit

Read every route, controller, validator and repository in `../task-management-api`. Output is
[`frontend-api-contract.md`](./frontend-api-contract.md).

Findings that changed the frontend design are folded into "Locked decisions" below.

### Phase 0.5 — Backend unblock

Four surgical fixes in the backend repo (left **uncommitted** on branch `dev` for review):

| File                                          | Fix                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/modules/auth/auth.repository.ts`         | `findByEmail`: `findUnique` → `findFirst` (email is only unique among active rows, via a partial index)         |
| `src/modules/auth/auth.routes.ts`             | dropped the body validator on `POST /auth/refresh` — the token is in an httpOnly cookie the browser cannot read |
| `src/modules/task-label/task-label.routes.ts` | `validate(schema, "params")` on both routes (was validating the body)                                           |
| `prisma/seed/{users,projects}.seed.ts`        | `upsert` → `create` (their unique selectors no longer exist)                                                    |

Verified: `tsc --noEmit` clean, `db:seed` green, login 200 + cookie, refresh 200 from cookie
alone, task-label detach/attach/409/detach round trip.

### Phase 1 — Foundation

Vite 8 · React 19 · TypeScript 6 · Tailwind v4 · shadcn/ui (radix) · React Router 7 ·
TanStack Query 5 · Axios · RHF + Zod 4 · Vitest + RTL + MSW · ESLint 10 + Prettier.

| Area      | Files                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| Transport | `lib/api/{token-store,client,refresh,interceptors,errors}.ts`                          |
| Query     | `lib/query/query-client.ts`                                                            |
| Forms     | `lib/forms/apply-api-errors.ts`                                                        |
| Dates     | `lib/utils/date.ts` (+ tests) — landed early because it encodes a contract trap        |
| Shell     | `app/providers/app-providers.tsx`, `app/router/router.tsx`, `app/layout/app-shell.tsx` |
| Shared UI | `components/{empty-state,error-state}.tsx`, `components/ui/*`                          |
| Testing   | `test/{setup.ts,render.tsx,msw/server.ts}`                                             |

### Phase 2 — Authentication

`features/auth/` — `api/{auth.api,auth.keys}.ts`, `auth-context.ts`, `auth-provider.tsx`,
`components/{require-auth,redirect-if-authenticated,credentials-form,auth-card}.tsx`,
`pages/{login,register}-page.tsx`, `schemas/auth.schemas.ts`, plus `app/layout/user-menu.tsx`.

Verified in a real browser against the live backend: cold boot → login; hard reload → session
restored with exactly one `POST /auth/refresh`; logout → 204 and reload confirms the session is
revoked server-side; register 409 → inline email error; register → auto-login → workspace.

**Deviation from the original plan:** no `auth.queries.ts` / `auth.mutations.ts`. The provider
owns the three auth transitions and pages use React Hook Form's `isSubmitting`. Splitting them
would have created two sources of truth for one state machine.

### Phase 3 — Projects

`features/projects/` — `api/{projects.api,projects.keys,projects.queries,projects.mutations}.ts`,
`lib/capabilities.ts`, `schemas/project.schemas.ts`, `pages/projects-page.tsx`,
`layout/project-workspace-layout.tsx`,
`components/{project-nav,project-tabs,project-form-dialog,create-project-dialog,edit-project-dialog,delete-project-dialog,invite-teammates-card}.tsx`.

The workspace derives its project and role from the `GET /projects` list query (always mounted
for the sidebar) rather than a `GET /projects/:projectId` call — see Locked decision 1 below.
Deep links cost zero extra requests, rename needs no second cache entry, and a project the
caller isn't a member of renders a clean "not found" without a 403 round-trip.

Verified: `typecheck`, `lint`, `test -- --run`, and `build` all clean.

**Deviations from the original plan:**

- The rename dialog is `edit-project-dialog.tsx` / "Edit Project", not `rename-project-dialog.tsx`
  / "Rename" — a deliberate naming call made while building, not an oversight.
- `useProjectRole(projectId)` and the `canManageMembers` / `canManageLabels` /
  `canChangeMemberRole` capability helpers from the plan were **not** added — nothing in Phase 3
  calls them yet (Members and Labels UIs don't exist until Phases 7–8). Add each when its phase
  gives it a real caller; `canManageProject` and `canAddMembersToProject` (used by the invite
  card) shipped because they already have one.

### Phase 4 — Task list

`features/tasks/` — `api/{tasks.api,tasks.keys,tasks.queries}.ts`,
`lib/{task-list-params,task-list-params.test}.ts`, `pages/tasks-page.tsx`,
`components/{task-toolbar,task-table,task-badges,task-pagination}.tsx`, `tasks.test.tsx`.
`features/members/` — `api/{members.api,members.keys,members.queries}.ts` (the read-only query
the assignee column and filter need). `components/native-select.tsx`. `lib/utils/date.ts` gained
`isOverdue`.

The URL is the single source of truth (`parseTaskListParams` / `toTaskListSearchParams`); the
search box is the one uncontrolled exception, debounced ~300ms into `setSearchParams`. Any filter
or sort change resets to page 1 and `replace`s history; paging `push`es. `keepPreviousData` keeps
rows visible (dimmed, `aria-busy`) during a refetch.

Verified: `typecheck`, `lint`, `test -- --run` (59 tests, incl. 18 param-parser cases and 7
router-level integration tests), and `build` all clean. Manually verified against the running
backend as `alice@example.com`: filter/search/sort/page each write the expected param and fire
one request per committed change; a copied URL reloads to the same view; hand-edited garbage
params (`page=0&status=BOGUS&assigneeId=nope`) fall back to defaults with no 400; `page=999`
renders "That page is empty" distinctly from "No tasks yet"; the table scrolls horizontally at
mobile width without widening the page.

**Deviations from the plan, both already recorded in
[`phase-4-task-list.md`](./phase-4-task-list.md):**

- **Flat table, not the prototype's status groups** (Decision 4). Grouping fights server-side
  pagination — a group's count would be its count on the current page, which reads as a
  project-wide total and would be a lie. Status grouping is deferred to Phase 11's board view.
- **No "Unassigned" filter option** (Decision 6). `assigneeId` is uuid-validated server-side, so
  the API cannot express "assignee is null" — tracked as **BE-9** below.

### Phase 5 — Task CRUD + detail

`features/tasks/` gained `api/tasks.mutations.ts` (`useCreateTask`, `useUpdateTask`,
`useDeleteTask`), `schemas/task.schemas.ts`, and
`components/{task-form-dialog,create-task-dialog,edit-task-dialog,delete-task-dialog,task-detail-panel}.tsx`.
`tasks.api.ts` gained `get`/`create`/`update`/`remove` and `CreateTaskInput`/`UpdateTaskInput`;
`tasks.keys.ts` gained `listsForProject`/`details`/`detail`; `tasks.queries.ts` gained
`useTask`. The detail route (`/projects/:projectId/tasks/:taskId`) nests under `tasks` in
`router.tsx` and renders inside `TasksPage`'s `<Outlet />` via `components/ui/sheet.tsx`
(added via `npx shadcn@latest add sheet`). Task rows in `task-table.tsx` are now links
(stretched-link pattern: an `after:absolute after:inset-0` anchor in the title cell) carrying
the current search string. `components/date-picker.tsx` (shared, `components/ui/{calendar,popover}.tsx`
via shadcn) replaces the raw `<input type="date">` in `task-form-dialog.tsx` with a button +
`Popover` + `Calendar`, wired through RHF's `Controller` since it isn't a native input; it
carries its own "Clear" action. The detail panel's content (eyebrow label, description-first
ordering, a `dt`/`dl` detail grid, inline Edit/Delete buttons, a disabled Comments placeholder
composer) was resynced against `design/app.html`'s `.panel` after a review found it had drifted
from the prototype — see `renderPanel()` in `design/assets/prototype.js` for the reference
markup. Tests: `features/tasks/tasks-crud.test.tsx`.

Verified against the running backend as `alice@example.com`: create appends a row without
navigating into it; deep link renders the panel with joined assignee email; editing sends only
the changed field(s), `dueDate` as a full ISO datetime, a cleared date as `null`, and a cleared
assignee as `null`; an unchanged submit fires no request; delete returns 204, closes the panel,
and lands back on the list with its search string intact; a bogus task id renders "This task no
longer exists" distinctly from the generic error state. `typecheck`, `lint`, `test -- --run`
(67 tests), and `build` all clean.

**Deviations from the plan:**

- **Backend fix, not a frontend workaround, for unassigning a task.** The open question in
  `phase-5-task-crud.md` §7 found that `create-task.schema.ts`'s `assigneeId: z.uuid().optional()`
  has no `.nullable()`, so `PATCH { assigneeId: null }` failed validation — the same shape of gap
  as BE-9. Rather than permanently hiding the "Unassigned" option once a task has an assignee,
  `update-task.schema.ts` was changed to `assigneeId: z.uuid().nullable().optional()` (update
  only — create still has no reason to accept an explicit null), with `UpdateTaskData.assigneeId`
  in `task.types.ts` widened to match. Left uncommitted in the backend repo for review, same as
  the Phase 0.5 fixes.
- **Row navigation is a stretched link inside the title cell**, not a per-row click handler —
  keeps the table keyboard- and screen-reader-correct without a non-semantic `<div onClick>`.

### Phase 6 — Comments

New `features/comments/` — `api/{comments.api,comments.keys,comments.queries,comments.mutations}.ts`
(`useComments`, `useCreateComment`, `useUpdateComment`, `useDeleteComment`),
`schemas/comment.schemas.ts`,
`components/{comment-form,comment-item,comments-section,delete-comment-dialog}.tsx`,
`comments.test.tsx`. `initials()` and its avatar markup were lifted out of
`task-detail-panel.tsx` into `components/user-avatar.tsx` (`UserAvatar`), now shared by the
assignee row and every comment author. The task panel's placeholder Comments `<section>` was
replaced with `<CommentsSection taskId={taskId} />`, and the sheet widened to `sm:max-w-md` to
give the thread and composer more room.

`comments.api.ts` fetches one page at `COMMENTS_PAGE_LIMIT = 100` (no `page` param, no
`CommentListQuery` type — one caller, no page state) and never write-throughs the cache; every
mutation invalidates `commentKeys.list(taskId)` instead, since the cached value is a
`{ data, pagination }` envelope and splicing it by hand to keep `pagination.total` correct
isn't worth it for a sub-100ms request. `comments-section.tsx` collapses threads over
`COMMENTS_COLLAPSED = 5` to the newest comments via `Array.slice` (`useState<boolean>`, no
fetch), so posting into a 40-comment thread never fetches a page the new comment isn't on.

Tests: `features/comments/comments.test.tsx`, router-level + MSW, mirroring
`tasks-crud.test.tsx`'s style — ordering, empty state, collapse/expand firing no request,
create/clear, whitespace-only validation, ownership-gated controls, edit round-trip + no-op
resubmit + 403 surfaced at form level, and delete leaving the panel open.

Verified against the running backend as `bob@example.com`: posting a comment appears after
invalidation and clears the composer; editing sends `PATCH { content }` and shows "(edited)";
deleting removes the row and leaves the task panel open. `typecheck`, `lint`,
`test -- --run`, and `build` all clean (two pre-existing failures in
`task-list-params.test.ts` and `tasks-crud.test.tsx`, unrelated to this phase — confirmed by
reproducing them on a clean `git stash`).

**Deviations from the plan:**

- **`Comment` carries no `taskId`.** §7's open question — read `comment.repository.ts`'s
  `commentSelect` in the backend instead of assuming the shape: it selects only
  `id, content, createdAt, updatedAt, author: { id, email }`. No `authorId`, `taskId` or
  `deletedAt` travel on the wire, so the frontend type says so.
- **The unchanged-content early return is a courtesy, not a correctness fix.** `content` is a
  required field on `CommentContentSchema` for both create and update, so there is no `{}` PATCH
  case to guard against the way task edits do — the early return in `comment-item.tsx` just
  avoids a pointless round trip.
- **The "(edited)" marker is safe as written.** `CommentService.updateComment` only ever sets
  `data.content`; nothing else touches `updatedAt`.
- **`CommentsSection` mounts alongside the task fetch, not after it.** The plan's wiring (§4)
  put `<CommentsSection>` inside `task-detail-panel.tsx`'s `{task ? ... : null}` block, which
  meant `useComments` didn't fire until `useTask` resolved — a render-order waterfall, not a
  real data dependency, since `taskId` is already known from the route. Post-review fix: the
  scrollable content region (and `CommentsSection` inside it) now mounts on `!isError && taskId`
  instead of on `task`, so both `GET /tasks/:id` and `GET /tasks/:id/comments` fire together on
  open. Task-specific fields inside that region stay gated on `task` itself; the 404 case still
  hides comments once the task query resolves. Confirmed via network log: both requests now fire
  back-to-back instead of sequentially. (Embedding comments in the task response — the other way
  to avoid the waterfall — was considered and rejected: this phase's own scope already rules out
  putting comment data on task rows, and it would bloat every task-list fetch for a detail-only
  need.)

### Phase 7 — Members

`features/members/` gained `api/members.mutations.ts` (`useAddMember`, `useUpdateMemberRole`,
`useRemoveMember`), `schemas/member.schemas.ts`,
`components/{add-member-form,members-table,member-role-select,remove-member-dialog}.tsx`,
`pages/members-page.tsx`, `members.test.tsx`. `members.api.ts` gained `add`/`updateRole`/`remove`.
`features/projects/lib/capabilities.ts` gained `canChangeMemberRole`/`canRemoveMember` — both take
the **target's** role alongside the actor's, since every backend rule here is a relation between
the two — with an exhaustive truth-table test alongside the existing capability tests.
`router.tsx` swapped the Phase 7 placeholder for the real page.

Ordering is client-side (OWNER → ADMIN → MEMBER, then email ascending) over the unpaginated
`GET /projects/:id/members` response — the repository itself orders by `joinedAt, userId`, which
the client sort makes cosmetic. The add-member 404/409 both land on the email field: `AppError`
subclasses return a bare `{ message }` with no `fieldErrors`, so `add-member-form.tsx` maps by
HTTP status before falling through to `applyApiErrors` — the same shape of gap Phase 3 hit with
the project duplicate-name 409.

Verified against the running backend as both `alice@example.com` (OWNER) and
`diana@example.com` (MEMBER): add/promote/remove all worked for the OWNER; 404 ("No account uses
that email address.") and 409 ("They're already a member of this project.") both rendered inline
on the email field; removing a member re-sorted the table and cleared its role/remove controls
from view; the MEMBER view showed a fully read-only table with no add form, no role selects, and
no remove buttons. `typecheck`, `lint`, `test -- --run` (107 tests), and `build` all clean.

**Deviations from the plan:**

- **`invite-teammates-card.tsx` had a real routing bug, not a hypothetical one.** Its
  `navigate()` call built a relative path (`projects/${projectId}/members`, no leading slash),
  so from inside `/projects/:id/tasks` it resolved relative to the current route instead of to
  `/projects/:id/members`. Fixed here per the plan's open question on this exact line.
- **No `table__col-action` utility class.** The design prototype defines one for the fixed-width
  action column, but it was never ported into `src/index.css` and `task-table.tsx` doesn't use it
  either — the members table follows that precedent instead of introducing a dead class.
- **Post-review polish, requested after the first pass shipped, later reverted in Phase 8's
  cross-page format pass:** the add-member form was briefly wrapped in a `bg-card`/border/shadow
  container. A later review against `design/assets/prototype.js`'s `renderMembers()` found the
  spec's `.inline-form` is bare — no card — so both `add-member-form.tsx` and Phase 8's
  `create-label-form.tsx` dropped the wrapper to match. The form still stacks to full width below
  `sm` and caps at `sm:max-w-sm` on wider screens. `member-role-select.tsx` wraps `NativeSelect` in
  a sized container `div` rather than passing a width straight to the `<select>` — passing it
  directly left `NativeSelect`'s chevron (positioned against its own full-width wrapper) stranded
  far right of the actual select box.

### Phase 8 — Labels + TaskLabel

**BE-4 resolved via a new endpoint, not the roadmap's `include`.** Re-verified against backend
source before scoping: no repository method on `Task` uses `include`, and the task-label routes
had no read path. Rather than `include: { labels: { include: { label: true } } }` on every task
select (which would reshape the `Task` type Phases 4–5 already depend on, and would force every
attach/detach to invalidate task lists and details), the backend gained a sub-resource endpoint —
`GET /tasks/:taskId/labels`, mirroring Phase 6's `GET /tasks/:taskId/comments` pattern. Surgical
addition across `label.repository.ts` (`findByTaskId`), `task-label.service.ts`
(`getTaskLabels`), `task-label.controller.ts`, `task-label.routes.ts` — left **uncommitted on
`dev`** for review, same as the earlier backend fixes. Full details and the three-reason
rationale are in [`phase-8-labels.md`](./phase-8-labels.md) §1. BE-4 is **reframed, not closed**:
the read path exists and the task detail panel uses it; list-level label display (a label column
or filter) is still unbuilt because nothing at that altitude reads labels yet.

New `features/labels/` — `api/{labels.api,labels.keys,labels.queries,labels.mutations}.ts`
(`useLabels`, `useTaskLabels`, `useCreateLabel`, `useUpdateLabel`, `useDeleteLabel`,
`useAttachLabel`, `useDetachLabel`), `schemas/label.schemas.ts`, `pages/labels-page.tsx`,
`components/{label-list,label-row,create-label-form,edit-label-dialog,delete-label-dialog,color-field,task-labels-section}.tsx`,
`labels.test.tsx`. `Label` lives in `src/types/api.ts` (cross-feature: the definitions screen and
the task panel both need it). `features/projects/lib/capabilities.ts` gained `canManageLabels`
(OWNER/ADMIN — attach/detach has no role gate, so nothing else needed one). `router.tsx` swapped
the Phase 8 placeholder for the real page; `task-detail-panel.tsx` renders
`<TaskLabelsSection taskId={taskId} projectId={projectId} />` mounted alongside the task and
comments fetches (not nested inside `task ? … : null`), avoiding the Phase 6 waterfall lesson a
second time.

The colour field (`color-field.tsx`) pairs a native `<input type="color">` swatch with the hex
text input, both bound to one React Hook Form field via `Controller` — the swatch alone is opaque
to a screen reader, and Zod validates the hex regardless of which control wrote it. The attach
picker on the task panel is a `Popover` of real `<button aria-pressed>` rows (a locked decision
from scoping — not the vendored `DropdownMenu`, despite `dropdown-menu.tsx` already existing),
so one control both attaches and detaches. Cache invalidation follows §6 of the phase doc: create
touches only the project's label list; **update and delete also invalidate every `taskLabelKeys`
entry**, since a rename/recolour or a cascading hard delete can change any open task's chips;
attach/detach touch only that task's label list. A 409 on attach (the cache is stale, not a real
conflict) invalidates and surfaces nothing to the user, matching idempotent detach's "no
pre-check" philosophy.

Verified against the running backend as `alice@example.com` (OWNER): created, edited (partial
`PATCH`, no-op resubmit sent no request) and hard-deleted a label with the cascade copy shown;
attach/detach round-tripped from the task panel's popover, including a label that had been
attached via seed data; duplicate-name 409 (create and rename) landed on the `name` field with no
`fieldErrors` in the response. `typecheck`, `lint`, `test -- --run` (124 tests), and `build` all
clean.

**Deviations from the plan:**

- **A colour picker was added to the prototype's text-only field**, per the phase doc's own
  scoping — the design spec shows a plain text input, but a picker plus the same text field
  satisfies both usability and the "colour is never the only path in" rule.
- **A Delete control per label row**, added because Phase 8 ships full CRUD, not just
  create/edit. `design/assets/prototype.js`'s `renderLabels()` was subsequently updated to match
  and now shows the same per-row Edit/Delete pair.

### Phase 9 — UX polish

Full sweep and findings are recorded in [`phase-9-ux-polish.md`](./phase-9-ux-polish.md); this is
the shipped summary. No API shapes changed, so `frontend-api-contract.md` has no updates from
this phase.

New shared primitives: `app/error-boundary.tsx` (`AppErrorBoundary`, wraps the routed tree in
`main.tsx`, renders an accessible alert with a reload action), `app/router/{route-focus,route-focus-context}.tsx`
(moves focus to the new route's heading on navigation), `components/busy-region.tsx` (the
`aria-busy` + `aria-live="polite"` + `sr-only`-label wrapper, modelled on `require-auth.tsx`'s
existing pattern, applied to all nine loading-skeleton sites), `components/scrollable-table-region.tsx`
(`tabIndex={0}` + `role="region"` + accessible name, replacing the dead `table-scroll` class in
both `task-table.tsx` and `members-table.tsx`).

Per-screen fixes across every feature: sign-out wrapped in `try`/`catch` with `isSigningOut` reset
and a `toast.error` (`user-menu.tsx`); label attach/detach failures now surface via `toast.error`,
409 still silently reconciled (`task-labels-section.tsx`); the task panel's 404 branch gained
`role="alert"`; focus returns to the triggering control after a dialog-driven delete
(delete-comment, remove-member, delete-label) and after cancelling a comment edit; the task list
announces committed filter/search/sort changes and shows a result count even at zero results;
refetch dimming moved off the text (was failing contrast at `opacity-60`) onto a non-text
affordance; pagination keeps focus on Previous/Next when a boundary disables it; the labels page
now gates its create form on the project query resolving, matching `members-page.tsx`; a skip
link plus an `id`ed `<main>`; comments gained `aria-expanded` on the collapse toggle and composer
copy for the ⌘/Ctrl+Enter submit shortcut; `sm:grid-cols-2` on the task form's Status/Priority
pair; the workspace header skeleton gained the `px-6` its real header has, so the page no longer
shifts on load. The toast-discipline rule (§ above, "Toasts are for a failure with no form or
field...") was written into `CLAUDE.md`'s Conventions, codifying the five pre-existing call sites
plus the two (sign-out, label attach/detach) that joined them here.

The app shell gained a real mobile layout: the project rail collapses behind a Radix `Sheet` off
the top bar below `md` (Decision, `phase-9-ux-polish.md` §5.1) instead of stacking the whole rail
above page content. `invite-teammates-card.tsx`'s three hardcoded placeholder avatars were
removed as part of that rework. The brand mark moved from `assets/illustration-tasks.svg` to a
new `taskly-logo.svg` / `taskly-illustration.webp` pair rendered through `components/logo.tsx`;
`vite-plugin-svgr` was added so the logo imports as a component. `.dark` CSS block and the
`bg-invite-card` utility's fate: the former is deliberately left unshipped and unverified
(Decision, § 5.5 — building a toggle is a feature, not polish); the latter was deleted as dead
CSS once the invite card's markup changed.

Verified: `typecheck`, `lint`, `test -- --run` (124 tests), and `build` all clean. The `docs/*.md`
sweep table (`phase-9-ux-polish.md` §2) was re-walked screen-by-screen after the fixes landed.

**Deviations from the plan:**

- **No confirmation dialog on member role change.** Considered (C-1) and deliberately rejected —
  reversible, backend-authoritative, and a dialog on every `<select>` change would be noise. See
  `phase-9-ux-polish.md` §5.4.
- **Dark mode.** Unshipped as of this phase — the `.dark` token block in `index.css` predated a
  toggle. A toggle shipped afterward: `lib/theme/theme-provider.tsx` + `theme-context.ts`
  (localStorage-backed, no `next-themes` since this is a Vite SPA) and `components/mode-toggle.tsx`
  (dropdown in `app-shell.tsx`'s header, next to `UserMenu`). The existing `.dark` palette was
  checked against the design system's AA rules and needed no changes — every text pairing already
  cleared 4.5:1 (most ≥6.5:1), including the status/priority soft-badge pairs.
- **No new backend gaps surfaced.** This was a frontend-only sweep; BE-4/5/7/8/9/10 are
  unaffected.

---

## Locked decisions

Carry these forward; they are consequences of the real API, not preferences.

1. **Role comes from `GET /projects`.** It is the sidebar query, always mounted, and the only
   endpoint returning the caller's `role` per project. Project detail does not expose it.
2. **Assignee display is a client-side join** against the per-project members query — task
   responses carry only `assigneeId`.
3. **Due dates**: date-only in the UI, full ISO datetime on the wire, converted only through
   `lib/utils/date.ts` in UTC so dates never shift a day.
4. **Three response envelopes coexist** — `{ data, pagination }`, `{ data }`, bare array. Type
   each endpoint honestly; no universal `unwrap()`.
5. **No dev proxy.** The refresh cookie is scoped to `Path=/auth`; a `/api/*` proxy would stop
   the browser sending it.
6. **One shared in-flight refresh promise.** The backend rotates refresh tokens, so parallel
   refreshes would race and log the user out.
7. **Access token in memory only**; restored at boot by one refresh call.
8. **Refresh skip-list is explicit** — `/auth/login`, `/auth/register`, `/auth/refresh`.
   `/auth/me` _must_ participate in refresh.
9. **The design system is teal, and `--primary` is not the moodboard's teal.** `moodboard/`
   supplies the direction; its brand colour is `#24C0B8`, which is only **2.26:1** against white
   and therefore cannot carry button text or a focus ring. `#24C0B8` stays as `--brand` — soft
   washes, the active-project marker, chart fills, the auth illustration — while `--primary` is
   the deeper `#0A7F78` (**4.86:1**). Do not "restore" the lighter teal to `--primary`.
   `design/` holds the full spec as static HTML (`npm run prototype`); `design/assets/tokens.css`
   and `src/index.css` are the same system in two notations, so change them together.

---

## ⬜ Remaining phases

### Phase 10 — Test coverage

Fill gaps against the risk, not for coverage numbers. High value: filter parsing, capability
helpers, cache invalidation after member removal, role-aware rendering. Add Playwright for
critical flows once behaviour has stopped moving.

---

### Phase 11 — Kanban (optional)

Only after the list workflow is stable. Board view, drag between columns → `PATCH` status. The
first genuinely good candidate for optimistic updates, with rollback.

---

## Backend gaps to track

| Id    | Gap                                                                             | When it matters                  |
| ----- | ------------------------------------------------------------------------------- | -------------------------------- |
| BE-4  | ~~A task's labels cannot be read back~~ — fixed via `GET /tasks/:taskId/labels` | List-level display still unbuilt |
| BE-5  | No `assignee` projection on tasks                                               | Worked around                    |
| BE-7  | `GET /projects` is unpaginated                                                  | Not yet                          |
| BE-8  | No change-password endpoint                                                     | Backlog                          |
| BE-9  | Tasks can't be filtered for "unassigned" [^be9]                                 | **Phase 4 on**                   |
| BE-10 | No project ownership transfer [^be10]                                           | **Phase 7**                      |
| —     | `search` matches `title` only                                                   | Phase 4 copy                     |
| —     | `refresh.schema.ts` is now dead code                                            | Cleanup                          |

[^be9]:
    `assigneeId` is uuid-validated, no way to express null. `PATCH` itself was fixed in
    Phase 5 (`update-task.schema.ts` now accepts `assigneeId: null`); this is only the
    _query_-side gap, since `task-query.schema.ts` still validates `assigneeId` as a plain uuid.

[^be10]:
    `project-member.service.ts` throws on any attempt to change or remove the OWNER role,
    and no other endpoint touches `Project.ownerId`. Confirmed against backend source while
    scoping Phase 7 — out of scope until a backend endpoint exists.

Do not expand backend payloads speculatively. Change them when a concrete UI need appears.

---

## Definition of done, per feature

A feature is not done because the happy path renders. Check:

- [ ] API behaviour matches the contract doc
- [ ] loading, empty and error states — and empty distinguishes "none" from "none matching"
- [ ] role-aware controls (UX only; backend stays authoritative)
- [ ] form validation, with server `fieldErrors` mapped onto fields
- [ ] cache invalidation, including cross-resource effects
- [ ] URL behaviour where the state is shareable
- [ ] accessibility: labels, focus, keyboard, contrast, non-colour status
- [ ] responsive at mobile and desktop
- [ ] `npm run typecheck && npm run lint && npm test -- --run && npm run build`
- [ ] tests proportional to risk — skip them for presentation-only changes
- [ ] final diff reviewed; findings flagged **Blocking / Recommended / Optional**

---

## Non-goals

No Redux, SSR, GraphQL, WebSockets, real-time collaboration, offline mode, service workers,
monorepo, design-system package, frontend permission framework, generic repository pattern, or
blanket optimistic mutations. No Kanban before the list view works.

Add architecture when a real requirement demands it, not because a larger app might.
