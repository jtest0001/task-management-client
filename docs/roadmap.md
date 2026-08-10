# Build roadmap

Working reference for building out the frontend. Companion documents:

- [`frontend-api-contract.md`](./frontend-api-contract.md) — verified API shapes. **Read before
  writing anything that talks to the backend.**
- [`../CLAUDE.md`](../CLAUDE.md) — conventions, state ownership, non-obvious constraints.

Update the status table as phases land.

---

## Status

| Phase                  | Scope                                            | Status      |
| ---------------------- | ------------------------------------------------ | ----------- |
| 0 — API contract audit | Read backend source, document real shapes        | ✅ Done     |
| 0.5 — Backend unblock  | Fix 3 blocking defects + seed                    | ✅ Done     |
| 1 — Foundation         | Tooling, API client, refresh flow, shell, tests  | ✅ Done     |
| 2 — Authentication     | Register, login, logout, boot restore, guards    | ✅ Done     |
| 3 — Projects           | List, create, workspace shell, role plumbing     | ⬜ Next     |
| 4 — Task list          | Filters, search, sort, pagination, URL state     | ⬜          |
| 5 — Task CRUD + detail | Create, detail route, edit, delete               | ⬜          |
| 6 — Comments           | List, create, edit/delete own                    | ⬜          |
| 7 — Members            | List, add by email, promote/demote, remove       | ⬜          |
| 8 — Labels + TaskLabel | Definitions CRUD, attach/detach — **needs BE-4** | ⬜          |
| 9 — UX polish          | States, a11y, responsive, keyboard               | ⬜          |
| 10 — Test coverage     | Fill gaps, add E2E for critical flows            | ⬜          |
| 11 — Kanban (optional) | Board view, drag/drop, optimistic status         | ⬜ Deferred |

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

### Phase 3 — Projects

**Build:** projects list page, create-project dialog, project workspace shell with routed tabs
(Tasks / Members / Labels), sidebar project list, `useProjectRole(projectId)` selector,
capability helpers (`canManageProject`, `canManageMembers`, `canManageLabels`,
`canChangeMemberRole`).

**Contract notes**

- `GET /projects` returns a **bare array of membership rows**, each with `role` and a nested
  `project`. Map to a view type in the query's `select`.
- `POST /projects` → 201; duplicate `(name, ownerId)` → **409**.
- `PATCH` / `DELETE /projects/:id` are **OWNER only** — an ADMIN sees a project they cannot
  rename. Follow the code, not the original spec wording.

**Cache:** create/update/delete → invalidate `projectKeys.lists()`.

**States:** empty ("No projects yet"), loading skeleton, error. `ethan@example.com` has no
projects — use it to check the empty state.

---

### Phase 4 — Task list

**Build:** the primary workspace. Toolbar (search, status, priority, assignee, sort), task rows,
pagination.

**Contract notes**

- `GET /projects/:projectId/tasks` → `{ data, pagination: { page, limit, totalPages, total } }`.
- Query params: `page`, `limit` (≤100), `status`, `priority`, `assigneeId`, `search`, `sortBy`
  ∈ `createdAt|dueDate|priority|title`, `sortOrder`. Search matches **title only** — say so in
  the placeholder.
- Rows need the members query to resolve `assigneeId` → email.

**URL state is the single source of truth.** Parse `useSearchParams` into a typed query object;
the query key derives from it. No mirrored `useState`.

**States:** distinguish "no tasks yet → create one" from "no tasks match these filters → clear
filters". Keep previous data visible during refetch.

---

### Phase 5 — Task CRUD + detail

**Build:** create dialog, detail route `/projects/:projectId/tasks/:taskId` (side panel on
desktop, still URL-addressable), edit, delete with confirmation.

**Contract notes**

- `PATCH /tasks/:taskId` is partial and **rejects an empty object** — send only changed fields.
- `dueDate`: `toApiDate` on write, `null` to clear, omit to leave alone.
- Assigning a non-member → **400** with a field-usable message.
- Any member may create/update/delete any task — no role gate in the UI either.

**Cache:** update → `setQueryData` on the detail + invalidate the project's task lists (status,
priority, assignee, dueDate and title all affect filtering and sorting membership). Delete →
invalidate lists, remove the detail, navigate back to the list.

---

### Phase 6 — Comments

**Build:** comment list, composer, edit/delete own inside task detail.

**Contract notes**

- `GET /tasks/:taskId/comments?page&limit` → `{ data, pagination }`, ordered `createdAt asc`.
- Response includes `author: { id, email }` — no join needed.
- Only the author may edit or delete; show those controls only when
  `comment.author.id === me.id`. Backend still enforces it.

**Cache:** any comment mutation → invalidate `commentKeys.list(taskId)`.

---

### Phase 7 — Members

**Build:** members list, add-by-email form, role select, remove with confirmation.

**Contract notes**

- `GET` returns `{ data: [{ role, joinedAt, user: { id, email } }] }` — **no `id` on the member
  itself**.
- **`:memberId` in the path is the target's `user.id`.**
- Add is OWNER/ADMIN only and always joins as `MEMBER` — do not offer a role picker.
- Role change is **OWNER only**, `ADMIN ↔ MEMBER`; never offer `OWNER`.
- Removal: OWNER removes ADMIN+MEMBER; ADMIN removes MEMBER only; OWNER never removable.
- Unknown email → **404**, already a member → **409**. Both belong on the email field.

**Cache — the cross-resource one:** removal unassigns that user's tasks server-side, so
invalidate **members + task lists + any open task detail**, not just members.

---

### Phase 8 — Labels + TaskLabel

**⚠️ Blocked on BE-4 for display.** Labels can be attached and detached but a task's labels
cannot be read back — absent from list and detail responses, and there is no
`GET /tasks/:taskId/labels`. Resolve this before building label rendering; the fix is
`include: { labels: { include: { label: true } } }` on the task selects. Attach/detach
themselves work (fixed in Phase 0.5).

**Build:** labels screen (view for all, CRUD for OWNER/ADMIN), attach/detach from task detail.

**Contract notes**

- Colour must match `^#[0-9A-Fa-f]{6}$`. Never rely on colour alone — always show the name.
- Label delete is a **hard delete** and cascades to `TaskLabel`. Confirm destructively.
- Duplicate name → **409**; duplicate attach → **409**; detach is idempotent, so no pre-check.
- MEMBER: read-only on definitions, but **may attach/detach**. Two different empty states.

---

### Phase 9 — UX polish

Sweep every screen for: loading / empty / error states, toast discipline (not for everything),
confirmation dialogs, responsive behaviour, keyboard paths, focus management, contrast, and
status never conveyed by colour alone.

---

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

| Id   | Gap                                  | When it matters |
| ---- | ------------------------------------ | --------------- |
| BE-4 | A task's labels cannot be read back  | **Phase 8**     |
| BE-5 | No `assignee` projection on tasks    | Worked around   |
| BE-7 | `GET /projects` is unpaginated       | Not yet         |
| —    | `search` matches `title` only        | Phase 4 copy    |
| —    | `refresh.schema.ts` is now dead code | Cleanup         |

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
