/*
 * Taskly workspace prototype.
 *
 * Vanilla JS over a fixture object — no framework, no fetch. The fixture deliberately mirrors
 * the real API shapes from `docs/frontend-api-contract.md`, including the awkward ones:
 *
 *   - a task carries `assigneeId` and nothing else about the person, so every row you see with
 *     an avatar is a client-side join against that project's members;
 *   - a task carries no labels at all (backend gap BE-4), which is why the task table has no
 *     label column and the Labels tab says so out loud;
 *   - `role` arrives per project on the projects list, so the rail is also the source of the
 *     capability checks below.
 */

/* ============================================================ fixture */

const USERS = {
  u1: { id: "u1", email: "alice@example.com" },
  u2: { id: "u2", email: "bob@example.com" },
  u3: { id: "u3", email: "charlie@example.com" },
  u4: { id: "u4", email: "diana@example.com" },
  u5: { id: "u5", email: "ethan@example.com" }
}

const CURRENT_USER = USERS.u1

/**
 * Due dates are relative to today so "overdue" and "due soon" always demonstrate themselves.
 * Formats the local calendar date directly — going through `toISOString()` converts local
 * midnight to UTC, which lands on the previous day for any timezone east of UTC.
 */
function dueIn(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const date = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${date}`
}

const PROJECTS = [
  {
    id: "p1",
    name: "Website Redesign",
    description: "Marketing site refresh before the Q4 launch.",
    role: "OWNER"
  },
  {
    id: "p2",
    name: "Mobile App v2",
    description: "Rebuild of the iOS and Android clients.",
    role: "ADMIN"
  },
  {
    id: "p3",
    name: "API Platform",
    description: "Public API, versioning and rate limits.",
    role: "MEMBER"
  },
  {
    id: "p4",
    name: "Internal Tools",
    description: "Small utilities the support team keeps asking for.",
    role: "OWNER"
  }
]

const MEMBERS = {
  p1: [
    { user: USERS.u1, role: "OWNER", joinedAt: "2026-02-11" },
    { user: USERS.u2, role: "ADMIN", joinedAt: "2026-02-14" },
    { user: USERS.u4, role: "MEMBER", joinedAt: "2026-03-02" },
    { user: USERS.u3, role: "MEMBER", joinedAt: "2026-05-19" }
  ],
  p2: [
    { user: USERS.u2, role: "OWNER", joinedAt: "2026-01-08" },
    { user: USERS.u1, role: "ADMIN", joinedAt: "2026-01-09" },
    { user: USERS.u3, role: "MEMBER", joinedAt: "2026-04-22" }
  ],
  p3: [
    { user: USERS.u3, role: "OWNER", joinedAt: "2025-11-30" },
    { user: USERS.u4, role: "ADMIN", joinedAt: "2026-01-15" },
    { user: USERS.u1, role: "MEMBER", joinedAt: "2026-06-01" }
  ],
  p4: [{ user: USERS.u1, role: "OWNER", joinedAt: "2026-07-28" }]
}

const TASKS = {
  p1: [
    {
      id: "t1",
      title: "Audit colour contrast across every badge",
      description:
        "The moodboard teal is 2.26:1 on white. Check every badge, chip and focus ring against AA before we ship the palette.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: "u1",
      dueDate: dueIn(2),
      createdAt: "2026-07-30"
    },
    {
      id: "t2",
      title: "Rewrite the pricing page copy",
      description: "Marketing wants the three-tier framing dropped.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      assigneeId: "u4",
      dueDate: dueIn(6),
      createdAt: "2026-07-28"
    },
    {
      id: "t3",
      title: "Replace the hero illustration",
      description: "Swap the stock photo for the new flat-vector set.",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "u2",
      dueDate: dueIn(-2),
      createdAt: "2026-07-21"
    },
    {
      id: "t4",
      title: "Set up redirects for the retired blog URLs",
      description: "301s for the 42 posts we are not migrating.",
      status: "TODO",
      priority: "HIGH",
      assigneeId: "u2",
      dueDate: dueIn(9),
      createdAt: "2026-08-01"
    },
    {
      id: "t5",
      title: "Decide on the testimonials section",
      description: "Keep, cut, or move below the fold. Needs a decision from marketing.",
      status: "TODO",
      priority: "LOW",
      assigneeId: null,
      dueDate: null,
      createdAt: "2026-08-03"
    },
    {
      id: "t6",
      title: "Compress the case-study images",
      description: "Nothing above 200 KB.",
      status: "TODO",
      priority: "LOW",
      assigneeId: "u3",
      dueDate: dueIn(14),
      createdAt: "2026-08-04"
    },
    {
      id: "t7",
      title: "Ship the new navigation",
      description: "Three top-level items instead of seven.",
      status: "DONE",
      priority: "HIGH",
      assigneeId: "u1",
      dueDate: dueIn(-9),
      createdAt: "2026-07-02"
    },
    {
      id: "t8",
      title: "Migrate the footer to the shared component",
      description: "",
      status: "DONE",
      priority: "MEDIUM",
      assigneeId: "u2",
      dueDate: dueIn(-12),
      createdAt: "2026-06-29"
    },
    {
      id: "t9",
      title: "Delete the unused webfonts",
      description: "Four families loaded, one used.",
      status: "DONE",
      priority: "LOW",
      assigneeId: "u4",
      dueDate: dueIn(-15),
      createdAt: "2026-06-24"
    },
    {
      id: "t10",
      title: "Write the launch announcement",
      description: "Short. One screenshot.",
      status: "DONE",
      priority: "MEDIUM",
      assigneeId: "u1",
      dueDate: dueIn(-4),
      createdAt: "2026-07-15"
    }
  ],
  p2: [
    {
      id: "t20",
      title: "Fix the crash on cold start (Android 15)",
      description: "Reported by 14 users since the 2.3.1 rollout.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: "u3",
      dueDate: dueIn(1),
      createdAt: "2026-08-02"
    },
    {
      id: "t21",
      title: "Offline draft sync",
      description: "Queue writes locally, replay on reconnect.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      assigneeId: "u2",
      dueDate: dueIn(11),
      createdAt: "2026-07-19"
    },
    {
      id: "t22",
      title: "Dark theme pass over the task list",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "u1",
      dueDate: dueIn(20),
      createdAt: "2026-08-05"
    },
    {
      id: "t23",
      title: "Drop the iOS 15 deployment target",
      description: "Under 1% of sessions.",
      status: "TODO",
      priority: "LOW",
      assigneeId: null,
      dueDate: null,
      createdAt: "2026-08-06"
    },
    {
      id: "t24",
      title: "Push notification permission prompt",
      description: "Ask on second session, not first launch.",
      status: "DONE",
      priority: "HIGH",
      assigneeId: "u3",
      dueDate: dueIn(-6),
      createdAt: "2026-07-08"
    },
    {
      id: "t25",
      title: "Move analytics behind a consent flag",
      description: "",
      status: "DONE",
      priority: "MEDIUM",
      assigneeId: "u2",
      dueDate: dueIn(-18),
      createdAt: "2026-06-30"
    }
  ],
  p3: [
    {
      id: "t30",
      title: "Rate limit the public search endpoint",
      description: "60 requests per minute per token.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: "u4",
      dueDate: dueIn(4),
      createdAt: "2026-08-01"
    },
    {
      id: "t31",
      title: "Version the error envelope",
      description: "Every error is `{ message }` today. Add a stable `code`.",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "u3",
      dueDate: dueIn(16),
      createdAt: "2026-07-27"
    },
    {
      id: "t32",
      title: "Return the assignee on task responses",
      description: "Frontend gap BE-5 — the client joins against members today.",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "u1",
      dueDate: dueIn(8),
      createdAt: "2026-07-25"
    },
    {
      id: "t33",
      title: "Publish the OpenAPI document",
      description: "",
      status: "DONE",
      priority: "LOW",
      assigneeId: "u4",
      dueDate: dueIn(-21),
      createdAt: "2026-06-11"
    }
  ],
  p4: []
}

/** `{ data, pagination }` — the tasks envelope. p1 pretends to be page 1 of a longer list. */
const PAGINATION = {
  p1: { page: 1, limit: 10, totalPages: 3, total: 24 },
  p2: { page: 1, limit: 20, totalPages: 1, total: 6 },
  p3: { page: 1, limit: 20, totalPages: 1, total: 4 },
  p4: { page: 1, limit: 20, totalPages: 0, total: 0 }
}

const COMMENTS = {
  t1: [
    {
      id: "c1",
      author: USERS.u2,
      createdAt: "2026-08-06",
      content: "The high-priority badge is the worst offender — 3.1:1 on the soft fill."
    },
    {
      id: "c2",
      author: USERS.u1,
      createdAt: "2026-08-07",
      content: "Deepened the text colour to #BE3A38, which gets it to 4.7:1. Re-checking the rest."
    }
  ],
  t3: [
    {
      id: "c3",
      author: USERS.u4,
      createdAt: "2026-08-05",
      content: "Illustration set is in the shared drive under /brand/2026."
    }
  ],
  t20: [
    {
      id: "c4",
      author: USERS.u3,
      createdAt: "2026-08-08",
      content: "Reproduced on a Pixel 8. It is the migration running before the DB is open."
    }
  ]
}

const LABELS = {
  p1: [
    { id: "l1", name: "Design", color: "#6D45A8" },
    { id: "l2", name: "Frontend", color: "#0A7F78" },
    { id: "l3", name: "Content", color: "#B45309" },
    { id: "l4", name: "Blocked", color: "#BE3A38" }
  ],
  p2: [
    { id: "l5", name: "Bug", color: "#BE3A38" },
    { id: "l6", name: "Release", color: "#0A7F78" }
  ],
  p3: [{ id: "l7", name: "Docs", color: "#12A79F" }],
  p4: []
}

/* ============================================================ capability helpers
 * Mirrors `features/projects/lib/capabilities.ts`. UX only — the backend is the boundary.
 */

const canManageProject = (role) => role === "OWNER"
const canManageMembers = (role) => role === "OWNER" || role === "ADMIN"
const canChangeMemberRole = (role) => role === "OWNER"
const canManageLabels = (role) => role === "OWNER" || role === "ADMIN"

/* ============================================================ helpers */

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "DONE"]

const STATUS_META = {
  TODO: { label: "To Do", modifier: "todo" },
  IN_PROGRESS: { label: "In Progress", modifier: "progress" },
  DONE: { label: "Done", modifier: "done" }
}

const PRIORITY_META = {
  LOW: { label: "Low", modifier: "low" },
  MEDIUM: { label: "Medium", modifier: "medium" },
  HIGH: { label: "High", modifier: "high" }
}

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  )

/** Users only ever have an email, so display names are derived from it. */
const localPart = (email) => email.split("@")[0]
const initials = (email) => localPart(email).slice(0, 2).toUpperCase()

/** Dates are date-only in the UI; the wire format is a full ISO datetime (lib/utils/date.ts). */
function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  })
}

function isOverdue(isoDate) {
  return isoDate < dueIn(0)
}

function memberFor(projectId, userId) {
  return MEMBERS[projectId].find((member) => member.user.id === userId)
}

function avatar(email, extraClass = "") {
  return `<span class="avatar ${extraClass}" aria-hidden="true">${esc(initials(email))}</span>`
}

/* ============================================================ state */

const state = {
  projectId: "p1",
  tab: "tasks",
  taskId: null,
  listState: "loaded",
  collapsed: new Set()
}

const currentProject = () => PROJECTS.find((project) => project.id === state.projectId)

/* ============================================================ rail */

function renderRail() {
  document.getElementById("rail-list").innerHTML = PROJECTS.map((project) => {
    const active = project.id === state.projectId
    return `
      <li>
        <button class="rail__link" type="button" data-project="${project.id}"
                ${active ? 'aria-current="page"' : ""}>
          <span class="rail__name">${esc(project.name)}</span>
          <span class="badge badge--role ${project.role === "OWNER" ? "badge--owner" : ""}">
            ${project.role}
          </span>
        </button>
      </li>`
  }).join("")
}

/* ============================================================ project header */

function renderHeader() {
  const project = currentProject()

  document.getElementById("project-name").textContent = project.name
  document.getElementById("project-description").textContent = project.description

  const roleBadge = document.getElementById("project-role")
  roleBadge.textContent = project.role
  roleBadge.className = `badge badge--role ${project.role === "OWNER" ? "badge--owner" : ""}`

  // An ADMIN sees the project they cannot rename — the controls are absent, not the project.
  document.getElementById("project-actions").innerHTML = `
    ${
      canManageProject(project.role)
        ? `<button class="btn btn--outline btn--sm" type="button">Rename</button>
           <button class="btn btn--ghost btn--sm" type="button">Delete project</button>`
        : ""
    }
    <button class="btn btn--primary" type="button" data-open-dialog="task">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
      Add task
    </button>`

  document.querySelectorAll("#tabs .tabs__link").forEach((tab) => {
    if (tab.dataset.tab === state.tab) tab.setAttribute("aria-current", "page")
    else tab.removeAttribute("aria-current")
  })
}

/* ============================================================ tasks tab */

function toolbar({ filtered }) {
  const assignees = MEMBERS[state.projectId]
    .map((member) => `<option>${esc(member.user.email)}</option>`)
    .join("")

  return `
    <div class="toolbar">
      <div class="input-group toolbar__search">
        <svg class="input-group__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor"
             stroke-width="1.5" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" stroke-linecap="round" />
        </svg>
        <label class="visually-hidden" for="task-search">Search task titles</label>
        <input class="input" id="task-search" type="search" placeholder="Search task titles…"
               value="${filtered ? "contrast" : ""}" />
      </div>

      <label class="visually-hidden" for="filter-status">Status</label>
      <select class="select" id="filter-status">
        <option>Any status</option>
        <option ${filtered ? "selected" : ""}>To Do</option>
        <option>In Progress</option>
        <option>Done</option>
      </select>

      <label class="visually-hidden" for="filter-priority">Priority</label>
      <select class="select" id="filter-priority">
        <option>Any priority</option>
        <option>Low</option><option>Medium</option><option>High</option>
      </select>

      <label class="visually-hidden" for="filter-assignee">Assignee</label>
      <select class="select" id="filter-assignee">
        <option>Anyone</option>
        <option>Unassigned</option>
        ${assignees}
      </select>

      <label class="visually-hidden" for="filter-sort">Sort by</label>
      <select class="select" id="filter-sort">
        <option>Newest first</option>
        <option>Due date</option>
        <option>Priority</option>
        <option>Title</option>
      </select>
    </div>
    <p class="filter-note">
      Search matches task titles only, and every filter lives in the URL — this view is shareable.
    </p>`
}

function taskRow(task) {
  const member = task.assigneeId ? memberFor(state.projectId, task.assigneeId) : null
  const priority = PRIORITY_META[task.priority]
  const done = task.status === "DONE"

  const assigneeCell = member
    ? `<span class="person" title="${esc(member.user.email)}">
         ${avatar(member.user.email)}
         <span class="person__name">${esc(localPart(member.user.email))}</span>
       </span>`
    : `<span class="person muted">
         <span class="avatar avatar--empty" aria-hidden="true">—</span>
         <span class="person__name">Unassigned</span>
       </span>`

  const overdue = Boolean(task.dueDate) && isOverdue(task.dueDate) && !done
  const overdueIcon = overdue
    ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
            aria-hidden="true"><circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5V8l2 2" stroke-linecap="round" /></svg>`
    : ""
  const overdueSuffix = overdue ? " (overdue)" : ""

  const dueCell = task.dueDate
    ? `<span class="due ${overdue ? "due--overdue" : ""}">
         ${overdueIcon}
         ${formatDate(task.dueDate)}${overdueSuffix}
       </span>`
    : `<span class="muted">No due date</span>`

  return `
    <tr data-task="${task.id}" ${state.taskId === task.id ? 'aria-selected="true"' : ""}>
      <td class="table__col-check">
        <input class="checkbox" type="checkbox" ${done ? "checked" : ""}
               aria-label="Mark ${esc(task.title)} done" />
      </td>
      <td>
        <button class="task-title ${done ? "task-title--done" : ""}" type="button"
                data-open-task="${task.id}">${esc(task.title)}</button>
      </td>
      <td>${assigneeCell}</td>
      <td class="cell-nowrap">${dueCell}</td>
      <td>
        <span class="badge badge--priority-${priority.modifier}">${priority.label}</span>
      </td>
      <td class="table__col-action">
        <button class="btn btn--icon-sm btn--ghost" type="button" aria-haspopup="menu"
                aria-label="Actions for ${esc(task.title)}">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="4" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" />
            <circle cx="12" cy="8" r="1.3" />
          </svg>
        </button>
      </td>
    </tr>`
}

function taskGroup(status, tasks) {
  const meta = STATUS_META[status]
  const collapsed = state.collapsed.has(status)

  return `
    <section class="group" data-collapsed="${collapsed}">
      <button class="group__header" type="button" data-group="${status}"
              aria-expanded="${!collapsed}"
              aria-label="${meta.label} — ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}">
        <svg class="group__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
        <span class="status-chip status-chip--${meta.modifier}">${meta.label}</span>
        <span class="count-pill">${tasks.length}</span>
        <span class="group__spacer"></span>
      </button>

      <div class="group__content">
        <div class="table-scroll">
          <table class="table">
            <caption class="visually-hidden">${meta.label} tasks</caption>
            <thead>
              <tr>
                <th class="table__col-check"><span class="visually-hidden">Done</span></th>
                <th scope="col">Task</th>
                <th scope="col">Assignee</th>
                <th scope="col">Due date</th>
                <th scope="col">Priority</th>
                <th class="table__col-action"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>${tasks.map(taskRow).join("")}</tbody>
          </table>
        </div>
      </div>
    </section>`
}

function pagination() {
  const page = PAGINATION[state.projectId]
  if (page.total === 0) return ""

  const shown = TASKS[state.projectId].length
  const from = (page.page - 1) * page.limit + 1
  const pages = Array.from({ length: page.totalPages }, (_, index) => index + 1)

  return `
    <nav class="pagination" aria-label="Task list pages">
      <span>Showing ${from}–${from + shown - 1} of ${page.total} tasks</span>
      <div class="pagination__pages">
        <button class="pagination__page" type="button" ${page.page === 1 ? "disabled" : ""}
                aria-label="Previous page">‹</button>
        ${pages
          .map(
            (n) =>
              `<button class="pagination__page" type="button"
                       ${n === page.page ? 'aria-current="page"' : ""}>${n}</button>`
          )
          .join("")}
        <button class="pagination__page" type="button"
                ${page.page === page.totalPages ? "disabled" : ""}
                aria-label="Next page">›</button>
      </div>
    </nav>`
}

function skeletonGroup() {
  const row = `
    <div class="skeleton-row">
      <div class="skeleton" style="width: 1rem; height: 1rem"></div>
      <div class="skeleton" style="flex: 1; height: 0.75rem"></div>
      <div class="skeleton" style="width: 6rem; height: 0.75rem"></div>
      <div class="skeleton" style="width: 4rem; height: 1.25rem"></div>
    </div>`

  return `
    <section class="group">
      <div style="display: flex; gap: 0.625rem; padding: 0.75rem; align-items: center">
        <div class="skeleton" style="width: 6rem; height: 1.5rem"></div>
        <div class="skeleton" style="width: 1.75rem; height: 1.5rem"></div>
      </div>
      ${row.repeat(3)}
    </section>`
}

function emptyState({ title, body, action, variant = "" }) {
  const icon =
    variant === "error"
      ? `<path d="M8 5v4M8 12h.01" /><circle cx="8" cy="8" r="6.5" />`
      : `<path d="M3 4.5h10M3 8h10M3 11.5h6" />`

  return `
    <div class="state ${variant === "error" ? "state--error" : ""}" ${
      variant === "error" ? 'role="alert"' : ""
    }>
      <span class="state__icon">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" aria-hidden="true">${icon}</svg>
      </span>
      <p class="state__title">${title}</p>
      <p class="state__body">${body}</p>
      <div class="state__actions">${action}</div>
    </div>`
}

function renderTasks() {
  const tasks = TASKS[state.projectId]

  if (state.listState === "loading") {
    return toolbar({ filtered: false }) + skeletonGroup() + skeletonGroup()
  }

  if (state.listState === "error") {
    return (
      toolbar({ filtered: false }) +
      emptyState({
        variant: "error",
        title: "Could not load these tasks",
        body: "The request failed before it reached the list. Nothing has been changed.",
        action: `<button class="btn btn--primary btn--sm" type="button">Try again</button>`
      })
    )
  }

  // "Nothing here yet" and "nothing matches your filters" are different problems with
  // different exits, so they are different states — never one shared "No results".
  if (state.listState === "filtered") {
    return (
      toolbar({ filtered: true }) +
      emptyState({
        title: "No tasks match these filters",
        body: 'Searching titles for "contrast" with status To Do returns nothing in this project.',
        action: `<button class="btn btn--outline btn--sm" type="button" data-clear-filters>
                   Clear filters
                 </button>`
      })
    )
  }

  if (state.listState === "empty" || tasks.length === 0) {
    return (
      toolbar({ filtered: false }) +
      emptyState({
        title: "No tasks yet",
        body: "Add the first one — any member of this project can create, edit and assign tasks.",
        action: `<button class="btn btn--primary btn--sm" type="button" data-open-dialog="task">
                   Add task
                 </button>`
      })
    )
  }

  const groups = STATUS_ORDER.map((status) => {
    const inStatus = tasks.filter((task) => task.status === status)
    return inStatus.length ? taskGroup(status, inStatus) : ""
  }).join("")

  return toolbar({ filtered: false }) + groups + pagination()
}

/* ============================================================ members tab */

function renderMembers() {
  const project = currentProject()
  const rows = MEMBERS[state.projectId]
    .map((member) => {
      const isOwner = member.role === "OWNER"
      const adminSelected = member.role === "ADMIN" ? "selected" : ""
      const memberSelected = member.role === "MEMBER" ? "selected" : ""
      const ownerBadgeModifier = isOwner ? "badge--owner" : ""

      const roleCell =
        canChangeMemberRole(project.role) && !isOwner
          ? `<label class="visually-hidden" for="role-${member.user.id}">
               Role for ${esc(member.user.email)}
             </label>
             <select class="select" id="role-${member.user.id}" style="width: 8rem">
               <option ${adminSelected}>ADMIN</option>
               <option ${memberSelected}>MEMBER</option>
             </select>`
          : `<span class="badge badge--role ${ownerBadgeModifier}">${member.role}</span>`

      // OWNER is never removable; an ADMIN may only remove MEMBERs.
      const removable =
        !isOwner && (project.role === "OWNER" || (project.role === "ADMIN" && member.role === "MEMBER"))

      return `
        <tr>
          <td>
            <span class="person">
              ${avatar(member.user.email)}
              <span class="person__name">${esc(member.user.email)}</span>
              ${member.user.id === CURRENT_USER.id ? '<span class="badge badge--role">you</span>' : ""}
            </span>
          </td>
          <td>${roleCell}</td>
          <td class="cell-nowrap muted">${formatDate(member.joinedAt)}</td>
          <td class="table__col-action">
            ${removable ? `<button class="btn btn--ghost btn--sm" type="button">Remove</button>` : ""}
          </td>
        </tr>`
    })
    .join("")

  // The hint sits outside the field so the button lines up with the input, not with the
  // bottom of the help text.
  const addForm = canManageMembers(project.role)
    ? `<form class="inline-form" novalidate>
         <div class="field">
           <label class="field__label" for="member-email">Add a member</label>
           <input class="input" id="member-email" type="email" placeholder="teammate@example.com"
                  aria-describedby="member-email-hint" />
         </div>
         <button class="btn btn--primary" type="button">Add member</button>
         <p class="inline-form__hint" id="member-email-hint">
           They join as MEMBER. An unknown email is a 404 and an existing member a 409 — both
           land on this field.
         </p>
       </form>`
    : `<div class="alert alert--info">
         <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" aria-hidden="true">
           <circle cx="8" cy="8" r="6.5" /><path d="M8 7.5v3.5M8 5h.01" />
         </svg>
         <span>You are a MEMBER of this project, so you can see the team but not change it.</span>
       </div>`

  return `
    <div class="stack">
      ${addForm}

      <section class="group">
        <div class="table-scroll">
          <table class="table">
            <caption class="visually-hidden">Project members</caption>
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Role</th>
                <th scope="col">Joined</th>
                <th class="table__col-action"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>

      <p class="filter-note">
        Removing someone also unassigns every task they held in this project — the task list
        refreshes with them.
      </p>
    </div>`
}

/* ============================================================ labels tab */

function renderLabels() {
  const project = currentProject()
  const labels = LABELS[state.projectId]
  const editable = canManageLabels(project.role)

  const list = labels.length
    ? `<div class="label-grid">
         ${labels
           .map(
             (label) => `
             <div class="label-row">
               <span class="badge__dot" style="background: ${esc(label.color)}"
                     aria-hidden="true"></span>
               <span class="label-row__name">${esc(label.name)}</span>
               <span class="muted text-xs">${esc(label.color)}</span>
               ${
                 editable
                   ? `<button class="btn btn--ghost btn--sm" type="button"
                              aria-label="Edit ${esc(label.name)}">Edit</button>`
                   : ""
               }
             </div>`
           )
           .join("")}
       </div>`
    : emptyState({
        title: "No labels yet",
        body: editable
          ? "Labels are per project. Create one and every member can attach it to a task."
          : "Nobody has defined a label for this project yet.",
        action: editable ? `<button class="btn btn--primary btn--sm" type="button">New label</button>` : ""
      })

  const createForm = editable
    ? `<form class="inline-form" novalidate>
         <div class="field">
           <label class="field__label" for="label-name">Label name</label>
           <input class="input" id="label-name" placeholder="Frontend" />
         </div>
         <div class="field" style="flex: 0 0 9rem">
           <label class="field__label" for="label-color">Colour</label>
           <input class="input" id="label-color" value="#0A7F78" aria-describedby="label-hint" />
         </div>
         <button class="btn btn--primary" type="button">Create label</button>
         <p class="inline-form__hint" id="label-hint">
           Six-digit hex. The name always shows next to the dot — colour never carries the
           meaning on its own.
         </p>
       </form>`
    : ""

  return `
    <div class="stack">
      ${createForm}
      ${list}
      <div class="alert alert--info">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" /><path d="M8 7.5v3.5M8 5h.01" />
        </svg>
        <span>
          Attaching labels to tasks is not shown here: task responses do not return their labels
          yet (backend gap BE-4), so the task table has no label column.
        </span>
      </div>
    </div>`
}

/* ============================================================ task detail panel */

function renderPanel() {
  const panel = document.getElementById("task-panel")
  const task = TASKS[state.projectId].find((candidate) => candidate.id === state.taskId)

  if (!task) {
    panel.hidden = true
    panel.innerHTML = ""
    return
  }

  const member = task.assigneeId ? memberFor(state.projectId, task.assigneeId) : null
  const comments = COMMENTS[task.id] ?? []
  const priority = PRIORITY_META[task.priority]
  const status = STATUS_META[task.status]

  panel.hidden = false
  panel.innerHTML = `
    <header class="panel__header">
      <div>
        <p class="eyebrow">Task</p>
        <h2 class="panel__title">${esc(task.title)}</h2>
      </div>
      <button class="btn btn--icon-sm btn--ghost" type="button" data-close-panel
              aria-label="Close task detail" style="margin-left: auto">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </button>
    </header>

    <div class="panel__body">
      <p class="text-sm">${task.description ? esc(task.description) : '<span class="muted">No description.</span>'}</p>

      <dl class="detail-grid">
        <dt>Status</dt>
        <dd><span class="status-chip status-chip--${status.modifier}">${status.label}</span></dd>

        <dt>Priority</dt>
        <dd><span class="badge badge--priority-${priority.modifier}">${priority.label}</span></dd>

        <dt>Assignee</dt>
        <dd>
          ${
            member
              ? `<span class="person">${avatar(member.user.email)}
                   <span class="person__name">${esc(member.user.email)}</span></span>`
              : '<span class="muted">Unassigned</span>'
          }
        </dd>

        <dt>Due date</dt>
        <dd>${task.dueDate ? formatDate(task.dueDate) : '<span class="muted">None</span>'}</dd>

        <dt>Created</dt>
        <dd class="muted">${formatDate(task.createdAt)}</dd>
      </dl>

      <div style="display: flex; gap: 0.5rem">
        <button class="btn btn--outline btn--sm" type="button">Edit task</button>
        <button class="btn btn--ghost btn--sm" type="button" data-open-dialog="delete"
                data-task-name="${esc(task.title)}">Delete</button>
      </div>

      <section>
        <h3 class="section-title">Comments (${comments.length})</h3>
        ${
          comments.length
            ? comments
                .map(
                  (comment) => `
              <article class="comment">
                ${avatar(comment.author.email)}
                <div style="min-width: 0">
                  <div class="comment__head">
                    <span class="comment__author">${esc(localPart(comment.author.email))}</span>
                    <span class="comment__time">${formatDate(comment.createdAt)}</span>
                  </div>
                  <p class="comment__body">${esc(comment.content)}</p>
                  ${
                    comment.author.id === CURRENT_USER.id
                      ? `<div class="comment__actions">
                           <button class="btn btn--ghost btn--sm" type="button">Edit</button>
                           <button class="btn btn--ghost btn--sm" type="button">Delete</button>
                         </div>`
                      : ""
                  }
                </div>
              </article>`
                )
                .join("")
            : `<p class="muted text-sm">No comments yet.</p>`
        }

        <form class="composer" novalidate>
          <label class="visually-hidden" for="comment-input">Add a comment</label>
          <textarea class="textarea" id="comment-input" placeholder="Add a comment…"></textarea>
          <div class="composer__actions">
            <button class="btn btn--primary btn--sm" type="button">Comment</button>
          </div>
        </form>
      </section>
    </div>`
}

/* ============================================================ render */

function render() {
  renderRail()
  renderHeader()

  const body = document.getElementById("pane-body")
  if (state.tab === "tasks") body.innerHTML = renderTasks()
  else if (state.tab === "members") body.innerHTML = renderMembers()
  else body.innerHTML = renderLabels()

  renderPanel()

  const assigneeSelect = document.querySelector("[data-assignee-options]")
  assigneeSelect.innerHTML =
    `<option>Unassigned</option>` +
    MEMBERS[state.projectId].map((member) => `<option>${esc(member.user.email)}</option>`).join("")
}

/* ============================================================ dialogs */

function openDialog(name, taskName) {
  if (taskName) document.getElementById("dialog-delete-name").textContent = taskName
  const dialog = document.getElementById(`dialog-${name}`)
  dialog.hidden = false
  dialog.querySelector("input, textarea, select, button")?.focus()
}

function closeDialogs() {
  document.querySelectorAll(".dialog-backdrop").forEach((dialog) => {
    dialog.hidden = true
  })
}

/* ============================================================ events */

document.addEventListener("click", (event) => {
  const target = event.target

  const project = target.closest("[data-project]")
  if (project) {
    state.projectId = project.dataset.project
    state.taskId = null
    state.listState = "loaded"
    document.getElementById("state-select").value = "loaded"
    render()
    return
  }

  const tab = target.closest("[data-tab]")
  if (tab) {
    state.tab = tab.dataset.tab
    render()
    return
  }

  if (target.closest("[data-goto-members]")) {
    state.tab = "members"
    render()
    return
  }

  const group = target.closest("[data-group]")
  if (group) {
    const status = group.dataset.group
    if (state.collapsed.has(status)) state.collapsed.delete(status)
    else state.collapsed.add(status)
    render()
    return
  }

  const openTask = target.closest("[data-open-task]")
  if (openTask) {
    state.taskId = openTask.dataset.openTask
    render()
    return
  }

  // Whole-row click is a mouse convenience; the title inside every row is the real control.
  const row = target.closest("tr[data-task]")
  if (row && !target.closest("input, button")) {
    state.taskId = row.dataset.task
    render()
    return
  }

  if (target.closest("[data-close-panel]")) {
    state.taskId = null
    render()
    return
  }

  const openDialogTrigger = target.closest("[data-open-dialog]")
  if (openDialogTrigger) {
    openDialog(openDialogTrigger.dataset.openDialog, openDialogTrigger.dataset.taskName)
    return
  }

  if (target.closest("[data-close-dialog]") || target.classList.contains("dialog-backdrop")) {
    closeDialogs()
    return
  }

  if (target.closest("[data-clear-filters]")) {
    state.listState = "loaded"
    document.getElementById("state-select").value = "loaded"
    render()
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return

  const openDialogEl = document.querySelector(".dialog-backdrop:not([hidden])")
  if (openDialogEl) {
    closeDialogs()
    return
  }
  if (state.taskId) {
    state.taskId = null
    render()
  }
})

document.getElementById("state-select").addEventListener("change", (event) => {
  state.listState = event.target.value
  state.tab = "tasks"
  render()
})

render()
