# Task Management Client

A modern, responsive task management application built with **React, TypeScript, TanStack Query, Tailwind CSS and shadcn/ui**.

The application provides a collaborative workspace for managing projects, tasks, members, labels and comments while demonstrating production-oriented frontend architecture, authentication handling, server-state management and role-aware user experiences.

🌐 **Live Demo:** https://task-management-client-vert.vercel.app
⚙️ **Backend API:** https://github.com/jtest0001/task-management-api

---

## Features

### Projects

* Create and manage projects
* View project-specific task workspaces
* Role-based project administration
* Project member management

### Tasks

* Create, update and delete tasks
* Assign tasks to project members
* Set task status and priority
* Configure due dates
* Filter, search, sort and paginate task lists
* Attach and remove labels

### Collaboration

* Add comments to tasks
* Edit and delete your own comments
* Manage project members
* Assign project roles
* Create reusable project labels

### Authentication

* User registration and login
* JWT access-token authentication
* Session restoration using refresh tokens
* Automatic access-token refresh
* Automatic handling of expired sessions
* Secure refresh tokens stored in `httpOnly` cookies

### Role-Based UI

The interface adapts to the authenticated user's project role.

Supported roles:

* `OWNER`
* `ADMIN`
* `MEMBER`

Authorization remains enforced by the backend API; frontend role checks are used only to provide the appropriate user experience.

---

## Tech Stack

### Core

* React 19
* TypeScript
* Vite
* React Router

### Data & API

* TanStack Query
* Axios

### Forms & Validation

* React Hook Form
* Zod

### UI

* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Sonner
* Geist

### Testing

* Vitest
* React Testing Library
* Mock Service Worker

### Tooling

* ESLint
* Prettier
* TypeScript

---

## Architecture

The frontend uses a **feature-based architecture**.

```text
src/
├── app/            # Application providers, router and layout
├── assets/         # Static application assets
├── components/     # Shared UI components
│   └── ui/         # shadcn/ui primitives
├── features/       # Domain-specific application features
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   ├── comments/
│   ├── members/
│   └── labels/
├── lib/            # API client, query client, forms and utilities
├── test/           # Test infrastructure
└── types/          # Shared domain types
```

Domain functionality lives inside its corresponding feature instead of being grouped globally by technical concern.

---

## State Management

The application deliberately avoids introducing a global state library when one is not required.

### Server state

Remote data is managed with **TanStack Query**.

Examples include:

* projects
* tasks
* comments
* members
* labels

Query keys are defined per feature and mutations invalidate the appropriate cached queries.

### URL state

Shareable task-list state is stored in URL search parameters.

Examples:

```text
?page=2
&status=IN_PROGRESS
&priority=HIGH
&search=authentication
&sort=dueDate
```

This keeps filtered views:

* bookmarkable
* refresh-safe
* shareable
* synchronized with browser navigation

### Local UI state

Temporary interface state remains local to components.

Examples include:

* dialog visibility
* dropdown state
* selected UI controls

---

## Authentication Architecture

Authentication uses a short-lived access token together with a server-managed refresh session.

```text
Login
  │
  ├── Access token
  │     └── stored in application memory
  │
  └── Refresh token
        └── httpOnly cookie
```

The access token is intentionally **not stored in `localStorage`**.

When the application loads, it attempts to restore the authenticated session through the refresh endpoint.

```text
Application boot
      │
      ▼
POST /auth/refresh
      │
      ├── valid session
      │      └── authenticated
      │
      └── invalid session
             └── unauthenticated
```

Concurrent API requests receiving `401` responses share a single refresh operation to prevent multiple refresh requests from racing against refresh-token rotation.

---

## API Integration

The application communicates with the separate Task Management REST API:

https://github.com/jtest0001/task-management-api

During local development the API runs by default at:

```text
http://localhost:3000
```

The frontend communicates directly with the API rather than through a Vite development proxy because authentication uses a refresh cookie scoped to the backend authentication routes.

---

## Getting Started

### Prerequisites

Install:

* Node.js
* npm

The backend API should also be running locally.

---

### 1. Clone the repository

```bash
git clone https://github.com/jtest0001/task-management-client.git
cd task-management-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file based on:

```text
.env.example
```

Configure the backend API URL according to your environment.

### 4. Start the application

```bash
npm run dev
```

The application will run at:

```text
http://localhost:5173
```

---

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript compilation and creates a production build.

```bash
npm run preview
```

Locally previews the production build.

```bash
npm run typecheck
```

Runs TypeScript type checking.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run format
```

Formats the project with Prettier.

```bash
npm run format:check
```

Checks formatting without modifying files.

```bash
npm test
```

Runs the Vitest test suite.

---

## Backend

The frontend is backed by a separate REST API repository:

**Task Management API**

https://github.com/jtest0001/task-management-api

The API provides:

* authentication
* refresh-token sessions
* projects
* project members
* tasks
* comments
* labels
* task-label relationships
* authorization and permission enforcement

---

## Design Principles

The project follows several deliberate frontend engineering principles:

* Keep server state in TanStack Query rather than duplicating it into component or global state.
* Keep shareable filters and pagination in the URL.
* Keep ephemeral interface state local.
* Treat backend authorization as the security boundary.
* Prefer explicit cache invalidation after mutations.
* Avoid abstractions until there is a genuine reusable use case.
* Provide deliberate loading, empty and error states.
* Build accessibility into features rather than treating it as a final pass.
* Keep reusable UI primitives separate from domain-specific components.
* Avoid storing access tokens in persistent browser storage.

---

## Related Repository

### Backend API

https://github.com/jtest0001/task-management-api

---

## Project Purpose

This project was built as a production-style full-stack application rather than a minimal CRUD demo.

The goal is to demonstrate practical approaches to:

* frontend architecture
* API integration
* authentication
* session management
* role-based applications
* server-state management
* form validation
* reusable component design
* error handling
* testing
* maintainable TypeScript application structure

---

## License

This project is intended for personal and portfolio use.
