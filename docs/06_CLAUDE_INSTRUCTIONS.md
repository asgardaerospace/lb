# Claude Code Instructions for Launchbelt

## Purpose

This document tells Claude (and any AI assistant operating on this repository)
how to work inside Launchbelt without breaking compliance, data integrity, or
role boundaries.

It derives from the other documents in `/docs`. Where this document is silent,
the other docs govern. Where this document conflicts with them, update the
source doc rather than improvising in code.

---

# 1. Reading Order

Before writing code for any task, read in this order:

1. `00_SYSTEM.md` — product identity and non-goals
2. `02_DATA_MODEL.md` — entities, fields, relationships, roles
3. `03_USER_GROUPS.md` — permissions per role
4. `04_WORKFLOWS.md` — state machines and transition rules
5. `07_API_SPEC.md` — existing endpoints and conventions
6. `05_UI_SCREENS.md` — the screen to build, if any
7. `01_ARCHITECTURE.md` — layering and tech stack constraints
8. The specific `/tasks/<n>.md` file

Do not start from the task file alone.

---

# 2. Task Execution Rules

## 2.1 One task at a time

Execute exactly the task file the user names. Do not pull in work from
adjacent tasks, even if it seems small. If a dependency is missing, state the
assumption and flag it at the end of the response.

## 2.2 No new entities

Do not introduce new tables, enums, or top-level domain concepts that are not
in `02_DATA_MODEL.md`. Extending a table with additional fields that a task
explicitly enumerates is permitted; declaring a new table is not.

## 2.3 Plan before coding

For any task that writes more than one file, state the implementation plan
first. The plan must name: the files to be created, the files to be modified,
the API routes to be added, and the assumptions.

## 2.4 Report after coding

End every task with: files created, files modified, API routes added, commands
run, and unresolved assumptions.

---

# 3. Code Conventions

## 3.1 Architecture layering

Per `01_ARCHITECTURE.md §9`:

- No business logic in client components or client-side JS.
- Validation, permission checks, and state-transition checks live in the API
  layer or in server-only libraries under `src/lib/`.
- Database access goes through a repository module (`src/lib/<domain>/repository.ts`).
- State-transition rules live in a dedicated state module
  (`src/lib/<domain>/state.ts`) so that UI and API can both read them.

## 3.2 API route structure

- Pages under `src/app/<role>/...` — one route per screen in `05_UI_SCREENS.md`.
- API routes under `src/app/api/<area>/...` following `07_API_SPEC.md`.
- Each API route handler must:
  1. Call `requireUser` or `requireRole([...])` from `src/lib/auth.ts`.
  2. Resolve `organization_id` from the returned session user — never from the
     request body.
  3. Parse the request body with a zod schema.
  4. For state-changing actions, call `canTransition` before mutating.
  5. For state-changing actions, write an audit log entry.
  6. Wrap the body in `try { ... } catch (err) { return errorResponse(err); }`.

## 3.3 Supabase usage

- Server handlers use `createServerSupabase()` (SSR, cookie-aware, respects RLS).
- Audit writes use `createServiceSupabase()` (service role, bypasses RLS).
  Service role must never be imported into a `"use client"` module.
- Client components use `createBrowserSupabase()` for realtime only; never for
  privileged reads.

## 3.4 Naming

- Audit actions follow `<entity>.<verb_past_tense>`, e.g.
  `supplier_profile.submitted`. Do not reuse an existing action for a new
  entity.
- Enum values are lowercase `snake_case`.
- File/column naming matches `02_DATA_MODEL.md` exactly.

---

# 4. Guardrails

## 4.1 Organization scoping

Every query that reads or writes org-scoped data must filter by the caller's
`organization_id`. RLS policies in `supabase/migrations/*.sql` enforce this at
the database; API handlers must enforce it again so that service-role code
paths do not leak data.

## 4.2 Role enforcement

Check the role at the start of every handler. Do not rely on UI hiding a
button. Use the role constants in `src/lib/auth.ts`.

## 4.3 Audit logs

Every critical action (see `07_API_SPEC.md §1.3` for the list) writes exactly
one audit log row. Metadata must include `previous_status` for state
transitions. The audit write uses the service role and must not be skipped on
error paths unless the whole transition itself failed.

## 4.4 ITAR / CUI / AS9100

When touching data flagged `itar_controlled`, `cui_controlled`, or any
compliance-linked entity, stop and confirm with the user before making
behavioral changes. Do not relax an access rule without an explicit request.

## 4.5 Destructive actions

Do not delete rows from `audit_logs`, `supplier_profiles`,
`routing_decisions`, `quotes`, or `jobs` under any circumstance. Prefer
status-based soft-archiving, documented per entity in `04_WORKFLOWS.md`.

---

# 5. When to Stop and Ask

Stop and ask the user before proceeding when:

- A `/tasks/<n>.md` file contradicts a `/docs/*.md` file on a non-trivial point
  (state machine, field list, role).
- A required piece of architecture is missing (e.g. no auth provider wired,
  no storage bucket configured).
- A change would require a new top-level entity, a new role, or a new enum
  value.
- A change would alter an RLS policy or audit-log schema.
- A commit would touch more than the task's stated scope.

For routine decisions (naming of a private helper, layout of a form section,
order of columns in a table view), proceed and note the choice in the report.

---

# 6. Commits

- One commit per task unless the user asks otherwise.
- Commit message: imperative summary line that names the module, not the
  mechanics. Example: `Implement supplier profile module`.
- Do not push. Wait for the user to review the diff.
- Do not commit `.env.local`, `.claude/settings.local.json`, or any file
  containing secrets.

---

# 7. Documentation Maintenance

When implementation diverges from the docs, update the docs in the same
session (or flag it for a follow-up task). The docs listed below are the
source of truth; keep them aligned:

| Topic | Source of truth |
|---|---|
| Entities and fields | `02_DATA_MODEL.md` |
| Role names and permissions | `02_DATA_MODEL.md` §1, `03_USER_GROUPS.md` |
| State machines | `04_WORKFLOWS.md` §12 |
| UI per role | `05_UI_SCREENS.md` |
| API endpoints | `07_API_SPEC.md` |
| Behavior of Claude in this repo | this file |

If code and a doc disagree, the doc wins for future work — but the existing
code is not silently refactored. Ask first.

---

# 8. Non-Goals for Claude

Claude does not:

- Invent new product requirements
- Combine tasks to save time
- Skip audit logging for brevity
- Move logic to the client to reduce round-trips
- Introduce a new dependency without naming it in the report
- Push, deploy, or run destructive git operations without explicit instruction
