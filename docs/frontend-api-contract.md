# Frontend API contract

Verified by reading the routes, controllers, validators and repositories of
`task-management-api` (branch `dev`), not from documentation. Re-verify after backend changes.

Base URL `http://localhost:3000` (`VITE_API_BASE_URL`). Auth is `Authorization: Bearer <access>`
unless noted. All errors are JSON.

## Error shape

| Case                  | Status              | Body                                                        |
| --------------------- | ------------------- | ----------------------------------------------------------- |
| `AppError` subclasses | 400/401/403/404/409 | `{ message }`                                               |
| Zod validation        | 400                 | `{ message: "Validation failed", fieldErrors, formErrors }` |
| Prisma P2002          | 409                 | `{ message: "Resource already exists" }`                    |
| Prisma P2025          | 404                 | `{ message: "Resource not found" }`                         |
| Prisma P2034          | 409                 | `{ message: "...concurrent update. Please try again." }`    |
| anything else         | 500                 | `{ message: "Internal server error" }`                      |

`fieldErrors` is `Record<string, string[]>`, keyed by field name — see
`src/lib/forms/apply-api-errors.ts`.

## Auth

| Endpoint                | Body                            | Response                                                      |
| ----------------------- | ------------------------------- | ------------------------------------------------------------- |
| `POST /auth/register`   | `{ email, password }` (pw 8–72) | **201** `{ id, email }` — **no tokens, no cookie**            |
| `POST /auth/login`      | `{ email, password }`           | **200** `{ user: { id, email }, accessToken }` + `Set-Cookie` |
| `POST /auth/refresh`    | _(cookie only)_                 | **200** `{ accessToken }` + rotated cookie                    |
| `GET /auth/me`          | —                               | **200** `{ id, email }`                                       |
| `POST /auth/logout`     | _(cookie only)_                 | **204**, clears cookie                                        |
| `POST /auth/logout-all` | _(cookie only)_                 | **204**, clears cookie                                        |

- Access token TTL **15m**. Refresh **7d**, **rotated on every refresh** — the old one is
  invalidated, which is why concurrent refreshes must be deduped (`src/lib/api/refresh.ts`).
- Refresh cookie: `httpOnly`, `sameSite=lax`, `secure` in production only, **`Path=/auth`**.
- **`Path=/auth` is why the dev server does not proxy the API.** Through a `/api/*` proxy the
  browser's request path would not match the cookie path and the cookie would never be sent.
- CORS `origin: FRONT_END_URL` (`http://localhost:5173`), `credentials: true`.
- Register does **not** sign you in — chain register → login.
- Bad credentials → generic **401**, no user enumeration.

## Projects

| Endpoint                      | Notes                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /projects`               | **bare array** of membership rows: `{ userId, projectId, role, joinedAt, project: { id, name, description, ownerId, createdAt } }`. Unpaginated. |
| `GET /projects/:projectId`    | raw `Project`; **no `currentUserRole`**                                                                                                          |
| `POST /projects`              | `{ name, description? }` → **201**; creator becomes `OWNER`                                                                                      |
| `PATCH /projects/:projectId`  | **OWNER only** (ADMIN gets 403)                                                                                                                  |
| `DELETE /projects/:projectId` | **OWNER only**, soft delete → **204**                                                                                                            |

Duplicate `(name, ownerId)` among non-deleted projects → **409**, from a raw partial index
(`Project_name_ownerId_key … WHERE deletedAt IS NULL`), not a Prisma `@@unique` — it arrives as a
bare `{ message }` with **no `fieldErrors`**, so map it onto `name` manually, rename included.

`name` 1–255 trimmed, `description` ≤5000 optional trimmed. `PATCH` body is `.partial().refine(…)`
and **rejects `{}`** — send only changed fields.

`POST` / `PATCH /projects` return a **raw `Project` row** (adds `updatedAt`, `deletedAt`) — a
different shape from the 5-field `project` nested inside each `GET /projects` membership row. Type
them as two distinct interfaces; don't reuse one for both.

`findByUserId` (backing `GET /projects`) has **no `orderBy`** — row order is undefined. Sort
client-side.

**`GET /projects` is how the UI knows the current user's role in a project** — it is the only
endpoint that returns it without an extra request.

## Tasks

| Endpoint                          | Notes                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| `GET /projects/:projectId/tasks`  | `{ data: Task[], pagination: { page, limit, totalPages, total } }` |
| `GET /tasks/:taskId`              | bare `Task`                                                        |
| `POST /projects/:projectId/tasks` | **201** bare `Task`                                                |
| `PATCH /tasks/:taskId`            | **200** bare `Task`; partial, rejects `{}`                         |
| `DELETE /tasks/:taskId`           | **204**, soft delete                                               |

Query: `page` (≥1, default 1), `limit` (≥1 ≤100, default 20), `status`, `priority`,
`assigneeId` (uuid), `search` (≤255, blank→ignored, case-insensitive `contains` on **title
only**), `sortBy` ∈ `createdAt|dueDate|priority|title` (default `createdAt`), `sortOrder` ∈
`asc|desc` (default `desc`). Ordering is deterministic (tiebreak on `id`, `dueDate` nulls last).

Body: `title` (1–255), `description?` (≤1000), `status?`, `priority?`, `assigneeId?`, `dueDate?`.

- **No `assignee` object and no `labels` in any task response** — only `assigneeId`. Join
  against the members query for display.
- **`dueDate` must be a full ISO datetime** (`z.iso.datetime()`); a bare `2026-08-15` is
  rejected. `null` clears, `undefined` leaves unchanged. See `src/lib/utils/date.ts`.
- Non-member assignee → **400** `"The selected assignee is not a member of this project"`.
- **Any member, including MEMBER, may create/update/delete any task.** No role gate.

## Comments

| Endpoint                                 | Notes                                   |
| ---------------------------------------- | --------------------------------------- |
| `GET /tasks/:taskId/comments?page&limit` | `{ data, pagination }`, `createdAt asc` |
| `POST /tasks/:taskId/comments`           | `{ content }` (1–5000) → **201**        |
| `PATCH /comments/:commentId`             | author only, else **403**               |
| `DELETE /comments/:commentId`            | **204**, author only, soft delete       |

Projection includes `author: { id, email }` — unlike tasks.

## Project members

| Endpoint                                        | Notes                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `GET /projects/:projectId/members`              | `{ data: Member[] }` — wrapped, **not** paginated                 |
| `POST /projects/:projectId/members`             | `{ email }` → **201**; OWNER/ADMIN only; always joins as `MEMBER` |
| `PATCH /projects/:projectId/members/:memberId`  | `{ role: "ADMIN" \| "MEMBER" }`; **OWNER only**                   |
| `DELETE /projects/:projectId/members/:memberId` | **204**; also unassigns their tasks                               |

- Projection is `{ role, joinedAt, user: { id, email } }` — **no `id` on the member itself**.
- **`:memberId` is the target's `user.id`**, not a membership row id.
- Removal: OWNER removes ADMIN+MEMBER; ADMIN removes MEMBER only; OWNER never removable.
- Unknown email → **404**; already a member → **409**.
- Removal unassigns the user's tasks in the same transaction, so **task lists and any open
  task detail must be invalidated alongside the members query**.

## Labels

| Endpoint                           | Notes                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| `GET /projects/:projectId/labels`  | bare array, `name asc`                                   |
| `POST /projects/:projectId/labels` | `{ name, color }`, `^#[0-9A-Fa-f]{6}$`; OWNER/ADMIN only |
| `PATCH /labels/:labelId`           | partial; OWNER/ADMIN only                                |
| `DELETE /labels/:labelId`          | **hard delete**, cascades `TaskLabel`; OWNER/ADMIN only  |

Unique `(projectId, name)` → duplicate name is **409**. All members may _view_.

## Task ↔ Label

`POST /tasks/:taskId/labels/:labelId` → **201**; `DELETE` → **204** (idempotent).
Cross-project label → **404**. Duplicate attach → **409**.

## Known gaps

| Id   | Gap                                                                                          | Impact                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| BE-4 | No way to **read** a task's labels — absent from list and detail, no `GET /tasks/:id/labels` | Blocks displaying labels in Phase 8. Fix: `include: { labels: { include: { label: true } } }` on the task selects. |
| BE-5 | No `assignee` projection on tasks                                                            | Worked around by joining client-side against the members query.                                                    |
| BE-7 | `GET /projects` is unpaginated                                                               | Fine at current scale.                                                                                             |
| —    | `search` matches `title` only, not `description`                                             | Reflect in UI copy.                                                                                                |
| —    | `PATCH /projects` is OWNER-only                                                              | An ADMIN can see a project they cannot rename; the UI must follow the code, not the spec.                          |

Fixed during Phase 0 (in the backend repo, uncommitted at time of writing): `findByEmail`
using `findUnique` on a non-unique column; `POST /auth/refresh` validating a body the browser
cannot send; task-label routes validating `params` against the request body; two seed
`upsert`s using dropped unique constraints.
