# Launchbelt Tasks

## Purpose

This folder contains scoped build tasks for Claude Code.

Each task should:

- Build one module only
- Reference `/docs`
- Avoid unrelated changes
- Preserve role-based access
- Maintain auditability

## How To Use

Prompt Claude Code with:

Read `/docs`.
Execute `/tasks/<task_file>.md`.

## Recommended Build Order

1. `01_create_supplier_profile.md`
2. `02_create_rfq_flow.md`
3. `03_build_routing_console.md`
4. `04_supplier_quote_submission.md`
5. `05_job_execution_tracking.md`