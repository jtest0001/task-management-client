---
name: design-system
description: Taskly's teal design system — palette, tokens, component patterns and accessibility rules. Load this before writing or reviewing any UI/UX code in client-app — new components, Tailwind classes, colors, badges, status chips, forms, dialogs, layout, or anything touching src/index.css, components/ui, or a page under src/features/*/pages or src/features/*/components.
---

# Taskly design system

Source of truth lives in two places that must stay in sync — change both together:

- **[`design/`](../../../design/)** — a static HTML prototype (`npm run prototype` →
  `http://localhost:4173`). It is the visual spec: `login.html`, `register.html`, `app.html`
  (the project rail + task workspace), `index.html` (palette + component reference).
  `design/assets/tokens.css` is the token list, `design/assets/app.css` is every component
  built only from those tokens.
- **[`src/index.css`](../../../src/index.css)** — the same tokens as oklch CSS variables,
  consumed by the real `Button`, `Input`, and every shadcn component in `components/ui`.

Before building UI: skim `design/app.html` (or the relevant screen) in the running prototype for
the actual layout, spacing and component shape — don't invent a new pattern if one already
exists there. Before styling anything, use the tokens below, never a raw hex.

## Palette

Direction comes from the project's moodboard. The brand teal is `#24C0B8` — at **2.26:1** against
white it fails WCAG AA for text, borders and focus rings, so it is deliberately **not**
`--primary`. It survives as `--brand`: soft washes, the active-project marker, chart fills, the
auth illustration. `--primary` is the deeper `--teal-600` (`#0A7F78`, **4.86:1**).

**Do not "correct" `--primary` back to `#24C0B8`.** This is a recorded decision
([`docs/roadmap.md`](../../../docs/roadmap.md), Locked decisions #9), not an oversight.

| Token | Value | Use |
| --- | --- | --- |
| `--brand` (teal-400) | `#24C0B8` | accents only — never text, never a background behind text |
| `--primary` (teal-600) | `#0A7F78` | buttons, links, active states — 4.86:1 |
| `--accent` / `--accent-foreground` | teal-50 / teal-700 | soft wash + its readable text |
| `--foreground` | `#131A19` | body text — 17.65:1 |
| `--muted-foreground` | `#5B6B69` | secondary text — 5.60:1 |
| `--border` / `--input` | `#E3E8E7` | hairlines, field borders |
| `--destructive` | `#BE3A38` | same red as priority HIGH — 5.45:1 |
| `--ring` | = `--primary` | focus rings |

Full 11-step teal scale (50→950) is in `design/assets/tokens.css` and mirrored as
`--chart-1…5` / `--sidebar-*` in `src/index.css`. Dark mode inverts the relationship: on a dark
canvas the bright `#24C0B8` clears AA (7.05:1), so `.dark` sets `--primary` and `--brand` to the
same teal-400.

## Status and priority — never color-only

The domain enums are `TaskStatus = TODO | IN_PROGRESS | DONE` and
`TaskPriority = LOW | MEDIUM | HIGH` (`src/types/api.ts`). Every chip/badge pairs a soft
background with an AA text color, and **always renders the label** — color is a reinforcement,
never the only signal.

| Semantic | Soft bg token | Text token | Contrast |
| --- | --- | --- | --- |
| status TODO | `--status-todo-soft` | `--status-todo` | high |
| status IN_PROGRESS | `--status-progress-soft` | `--status-progress` (amber) | 5.02:1 |
| status DONE | `--status-done-soft` | `--status-done` (teal-700) | 6.91:1 |
| priority LOW | `--priority-low-soft` | `--priority-low` (violet) | 6.85:1 |
| priority MEDIUM | `--priority-medium-soft` | `--priority-medium` | teal-700 |
| priority HIGH | `--priority-high-soft` | `--priority-high` | 5.45:1 |

These are Tailwind-reachable via `@theme inline` in `src/index.css`:
`bg-priority-high-soft text-priority-high`, `bg-status-done-soft text-status-done`, etc.

## Type, radius, shadow

- Font: `"Geist Variable", system-ui, -apple-system, "Segoe UI", sans-serif` — already imported
  in `src/index.css`; don't reintroduce `"Inter"`.
- Radius: `0.5rem` base (`--radius`), cards/dialogs `0.75rem` (`--radius-lg`), pills `999px`.
- Shadows: soft, low-opacity — reuse `--shadow-xs/sm/md/lg/xl` from `src/index.css`; don't
  hand-roll a new box-shadow.

## Component patterns already specified

`design/assets/app.css` has a working, named implementation of every recurring piece — port
class-for-class into Tailwind/shadcn rather than redesigning:

- **Buttons** — `.btn--primary/outline/ghost/destructive`, sizes `sm/default/lg`, icon-only.
  Maps to the existing `components/ui/button.tsx` variants; extend that file, don't fork it.
- **Fields** — `.field` (label + input/select/textarea + hint/error), invalid state via
  `aria-invalid`, never color-only.
- **Badges / status chips** — `.badge--priority-*`, `.status-chip--*`, `.badge--role`
  (OWNER/ADMIN/MEMBER pill).
- **Tables** — sticky-ish muted header row, hover row background, `aria-selected` for the open
  row, `table__col-check` / `table__col-action` fixed-width utility columns.
- **Project rail** — active item on `--accent-wash` with a `--brand` left-edge marker
  (`.rail__link[aria-current="page"]::before`) — the brand teal's actual job in this system.
- **Empty / loading / error states** — `.state`, `.state--error`, `.skeleton` shimmer. Every
  collection needs its own "nothing here yet" vs "nothing matches your filters" — see
  `renderTasks()` in `design/assets/prototype.js` for the two distinct copies.
- **Dialogs** — `.dialog-backdrop` / `.dialog`, matches what Radix `Dialog`/`AlertDialog` will
  render once Phase 3 adds them (`npx shadcn@latest add dialog textarea alert-dialog`).
- **Task detail panel**, **inline add-forms** (`.inline-form` + `.inline-form__hint` — hint sits
  *below* the input+button row, not inside the field, so the button stays aligned with the input
  and doesn't sink to the bottom of a taller field block).

## Accessibility rules (non-negotiable, from `CLAUDE.md`)

- Real buttons and labelled inputs, not `<div onClick>`.
- Keyboard-navigable dialogs (Radix handles focus trap/restore — still needs a real
  `DialogDescription`).
- Status/priority/role is never color-only — label text is mandatory.
- Focus rings always visible (`--ring` = `--primary`, 4.86:1 minimum).
- Check contrast against the tables above before introducing a new color — don't eyeball it.

## Verify a change

```bash
npm run prototype   # design/ at :4173 — check the change against the spec first
npm run dev          # :5173 — needs the backend on :3000, confirms it in the real app
```

If a change alters a token, update `design/assets/tokens.css` **and** `src/index.css` in the
same commit — that's the whole point of keeping them side by side.
