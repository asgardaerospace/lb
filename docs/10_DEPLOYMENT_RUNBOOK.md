# Launchbelt — Deployment Runbook

Production deployment procedure for the recovery release at HEAD `5d4db22`.
Follow each step in order. Stop at the first unexpected result and resolve
before continuing.

---

## 0. Release identity

| Field | Value |
|---|---|
| Target HEAD | `5d4db22` (Dev preview overhaul) |
| Branch | `main` |
| Migrations introduced since last deploy | `0006`, `0007`, `0008`, `0009` |
| Intake migrations (Phase 1, schema-only) | `0010`, `0011`, `0012`, `0013`, `0014` |
| Intake migrations deferred (Phase 4) | `0015_intake_conversion.sql` — held under `supabase/proposed/` until conversion + backfill phase |
| Storage bucket required | `launchbelt-documents` (private) |

To verify your local checkout is at the right tip:

```bash
git fetch origin
git rev-parse HEAD
# expected: 5d4db2206ee49eae5dc670420f03787602407ef9
```

---

## 1. Pre-deploy verification

Run from the repo root.

```bash
npm ci
npm run lint
npm run build
```

All three must succeed with no errors. The build output should list every
route under `/admin`, `/buyer`, `/supplier`, `/api/...` plus `/dev-preview`,
`/debug/runtime`, and `/`.

If any step fails, **do not deploy** — fix locally and re-verify.

---

## 2. Environment variables

Set these on Vercel (Project Settings → Environment Variables) for the
**Production** environment. Re-set for **Preview** if you want preview
deploys to hit a real Supabase project; otherwise the platform's preview-mode
fallbacks render without them.

| Name | Source | Purpose | Scope |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API → Project URL | Browser + server Supabase client; Realtime endpoint for the notifications bell | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API → `anon` key | Browser Supabase client; subject to RLS | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API → `service_role` key | Server-only writes that bypass RLS (dispatch helpers, audit, document storage, traveler) | **Secret — never expose** |

Notes:
- `NEXT_PUBLIC_*` variables are inlined into the browser bundle. Do not put
  the service role key behind a `NEXT_PUBLIC_` prefix.
- `NODE_ENV` is set to `production` automatically by Vercel; `/dev-preview`
  is gated on this and 404s in production builds.

After saving, redeploy or trigger a fresh build so the values take effect.

---

## 3. Supabase migrations — run in order

Apply against the production Supabase project, in this exact sequence. Each
file is idempotent (uses `if not exists` / `do $$ ... end$$;` guards) so
re-running is safe.

```bash
# from the repo root, with the CLI logged into the production project
supabase db push --linked
```

Or if you prefer to apply files individually (Dashboard → SQL Editor):

1. `supabase/migrations/0006_documents_storage.sql`
   Extends the existing `documents` table with `entity_type`, `entity_id`,
   `file_name`, `mime_type`, `size_bytes`, `description` and adds two
   indexes. No data loss; existing rows keep their NULLs.
2. `supabase/migrations/0007_notifications.sql`
   Creates `notifications` table + RLS (owner-only select/update,
   admin-sees-all). Idempotently publishes the table to the
   `supabase_realtime` publication so the topbar bell can subscribe.
3. `supabase/migrations/0008_job_traveler.sql`
   Creates `traveler_step` enum and `job_traveler_steps` table with
   `unique (job_id, step)` + RLS that mirrors job visibility.
4. `supabase/migrations/0009_rfq_compliance_overrides.sql`
   Adds nullable `itar_override` and `cui_override` columns to `rfqs`.
   Existing rows start `NULL` (= inherit program flag).
5. `supabase/migrations/0010_intake_enums.sql`
   Adds intake-related enum types (`supplier_application_status`,
   `customer_application_status`, `customer_tier`, `customer_org_type`,
   `customer_funding_stage`, `customer_geography`, `customer_lead_tolerance`,
   `customer_program_stage`, `customer_first_use_action`,
   `scoring_model_kind`). All wrapped in `do $$ if not exists ... $$` guards
   so the file is idempotent.
6. `supabase/migrations/0011_supplier_applications.sql`
   Creates `supplier_applications` (intake snapshot) plus 5 child tables:
   `supplier_application_certifications`, `_machines`, `_capabilities`,
   `_past_performance`, `_reviews`. RLS gates: admin sees all; org members
   see / write their own (drafts and revision-requested only); no anon
   policy (anonymous intake will route through SECURITY DEFINER RPCs in
   Phase 5). Operational `supplier_profiles` is **not** modified — the FK
   linkage column lives in 0015 (deferred). `converted_profile_id` exists
   on `supplier_applications` as a bare uuid; the FK constraint is added
   in 0015.
7. `supabase/migrations/0012_customer_applications.sql`
   Creates `customer_applications` plus 5 child tables (`_programs`,
   `_processes`, `_contacts`, `_defense_programs`, `_reviews`) plus the
   **NEW operational tables** `customer_profiles`, `customer_routing_weights`,
   `customer_supplier_filters`. The new operational tables have no rows
   until conversion runs in Phase 4. RLS shape mirrors 0011.
8. `supabase/migrations/0013_intake_scoring.sql`
   Creates `scoring_models` (versioned), `supplier_readiness_scores`,
   `customer_fit_scores`. Seeds two v1 model rows (one per kind) via
   `insert ... where not exists`, so re-running is safe. Scores are
   admin-only — applicants never see their own score.
9. `supabase/migrations/0014_intake_documents.sql`
   `ALTER TYPE document_entity_type ADD VALUE IF NOT EXISTS` for
   `'supplier_application'` and `'customer_application'`. Adds the FK from
   `supplier_application_certifications.document_id` to `documents.id`.
   No new tables. The migration is intentionally enum-and-FK only — convenience
   helpers that reference the new enum values must live in a later migration
   so they run after this file's transaction commits (PostgreSQL forbids
   *using* a freshly added enum value within the same transaction in which
   it was created).

> **Phase 4 conversion deferred.** `supabase/proposed/0015_intake_conversion.sql`
> defines `convert_supplier_application(uuid)` and
> `convert_customer_application(uuid)` plus the linkage FK columns
> (`supplier_applications.converted_profile_id` → `supplier_profiles`,
> `supplier_profiles.source_application_id` → `supplier_applications`, and
> the customer-side equivalents). It is **not** moved into
> `supabase/migrations/` in this release. Promote only when the FDE review
> console is ready to call the conversion functions and a backfill plan for
> existing `supplier_profiles` rows has been agreed.

After all nine are applied, verify in the SQL editor:

```sql
-- columns added
select column_name from information_schema.columns
  where table_name = 'documents'
    and column_name in ('entity_type','entity_id','file_name','mime_type','size_bytes','description');

select column_name from information_schema.columns
  where table_name = 'rfqs'
    and column_name in ('itar_override','cui_override');

-- new tables
select to_regclass('public.notifications'),
       to_regclass('public.job_traveler_steps');

-- realtime publication
select schemaname, tablename from pg_publication_tables
  where pubname = 'supabase_realtime' and tablename = 'notifications';

-- intake schema (Phase 1)
select to_regclass('public.supplier_applications'),
       to_regclass('public.customer_applications'),
       to_regclass('public.customer_profiles'),
       to_regclass('public.customer_routing_weights'),
       to_regclass('public.customer_supplier_filters'),
       to_regclass('public.scoring_models'),
       to_regclass('public.supplier_readiness_scores'),
       to_regclass('public.customer_fit_scores');

-- intake enums present
select typname from pg_type
  where typname in (
    'supplier_application_status','customer_application_status',
    'customer_tier','customer_org_type','customer_funding_stage',
    'customer_geography','customer_lead_tolerance','customer_program_stage',
    'customer_first_use_action','scoring_model_kind'
  )
  order by typname;

-- documents enum extended (expect 6 values: rfq, part, quote, job, supplier_application, customer_application)
select unnest(enum_range(null::document_entity_type))::text;

-- v1 scoring models seeded
select kind, version, active from scoring_models order by kind, version;
```

All queries should return non-empty results. The scoring models query
should show one row per `kind` at version 1 with `active = true`.

---

## 4. Supabase Storage — bucket setup

The document upload/download flow expects a single private bucket.

| Field | Value |
|---|---|
| Bucket name | `launchbelt-documents` |
| Public bucket? | **No** (private) |
| File size limit | 25 MB (enforced server-side; bucket can be left at default) |
| Allowed MIME types | unrestricted (filtered in app code) |

Steps (Supabase Dashboard → Storage → Buckets):

1. Click **New bucket**.
2. Name: `launchbelt-documents`. Toggle **Public bucket OFF**.
3. Save. No additional policies are needed — every read goes through a
   service-role-signed URL with a 60-second expiry generated by
   `/api/documents/[id]/download`.

If the bucket name differs in any environment, update the `DOCUMENTS_BUCKET`
constant in `src/lib/documents/storage.ts` (currently `launchbelt-documents`).

---

## 5. Vercel deploy

1. Push of `main` to `origin` triggers an auto-deploy if Vercel is wired to
   the repo (the recovery push has already happened — `531b81c..5d4db22`).
2. Watch the deploy log. Ensure `npm run build` completes with no TypeScript
   errors.
3. After "Build successful", Vercel promotes the new build to the
   Production URL.

If any environment variable is missing the build will succeed but every
authenticated route will fall back to preview mode at runtime — see §7.

---

## 6. Post-deploy smoke tests

Open these routes in the production URL after the deploy goes live. Each
should render without a 500. Behavior expectations are listed.

| Route | Expected (signed-out / preview) | Expected (signed in, correct role) |
|---|---|---|
| `/` | Landing page renders, role entry cards visible. | Same. |
| `/dev-preview` | **404** (production hides this). | 404 — same gate. |
| `/admin` | Operations Control Center renders with `PreviewDataBanner`; KPI cards show `PREVIEW_KPIS` numbers. | Live KPIs (Total Routed Value, RFQs Submitted, Jobs Active, Supplier Utilization). Live work pipeline table when jobs exist. |
| `/supplier` | Supplier dashboard preview renders with mock work packages + jobs. | KPIs show Active Jobs / Quote Win Rate / Avg Response Time / Quotes Pending; assigned work packages and active job cards. |
| `/buyer/dashboard` | Buyer Mission Control preview with mock programs + RFQs. | KPIs show Programs Active / RFQs Submitted / In Routing / Jobs in Production. |
| `/admin/jobs` | Empty preview. | Live job list filtered by org=admin (sees all). |
| `/supplier/jobs` | Empty-state CTA → quote requests. | Live job list scoped to the supplier org. |

Additional quick checks:

- Topbar **bell icon** appears only on authenticated requests (RoleShell gates
  `topbarRight` on `getOptionalUser()`).
- Click into any job detail. Confirm the **Digital traveler** section
  renders four steps (with empty hint until status moves), the **Document
  chain** panel renders even when empty, and the **Activity** feed renders
  (empty hint when no events).
- Sign in as a buyer, open an RFQ in draft state, change ITAR or CUI to
  `Required for this RFQ`. Toast should fire and the page refresh should
  preserve the value.

---

## 7. Graceful degradation if a migration is skipped

The app is wired to fail soft when a migration hasn't been applied yet. This
is the runtime behavior for each missing piece:

| Skipped step | Affected feature | What the user sees |
|---|---|---|
| Migration `0006` not applied | Document upload/list/download | `DocumentsSection` shows "Storage not connected" callout; uploads return HTTP 503 from `/api/documents/upload`. Page renders normally. |
| Migration `0006` applied but `launchbelt-documents` bucket missing | Document upload | Same as above — `StorageNotConfiguredError` thrown by the storage helper is caught and surfaced as the 503 message. Existing rows in the `documents` table still list. |
| Migration `0007` not applied | Notifications | Bell renders empty ("No notifications yet"). Dispatch helpers in workflow handlers swallow the missing-table error in dev (`process.env.NODE_ENV !== 'production'` logs only). RFQ submission, quote acceptance, and job-status changes still complete normally. |
| Realtime publication line in `0007` not applied | Live notification deliveries | Bell still works — falls back to the 120-second polling backstop. New notifications appear within ~2 minutes instead of instantly. |
| Migration `0008` not applied | Digital traveler | `JobTraveler` renders the four-step grid with all steps "Pending" and the configured `emptyHint`. Job status mutations still succeed; the traveler-step record write fails but is wrapped in `recordStepBestEffort` which swallows the error. |
| Migration `0009` not applied | RFQ ITAR/CUI overrides | `RfqEditor` Compliance section renders with both selects defaulting to "Inherit from program". Saving will fail with a 500 from the PATCH endpoint when the columns don't exist; the toast shows the error message. The routing engine continues to read the program-level flags. |
| Migrations `0010`–`0014` not applied | Intake persistence | **No user-visible impact in this release.** Phase 1 is schema-only — no submit RPC, no admin list view, no UI wiring. The customer onboarding wizard at `/onboarding` continues to use `localStorage` exclusively; the supplier application wizard remains design-only. The new tables stay empty. |
| Migration `0014` partially applied (enum extended but FK fails) | Intake document attachment | Will not happen in normal flow — the FK is enum-free and runs in the same transaction as the enum addition. If it does fail in isolation, document upload via `/api/documents/upload` continues to function for existing entity types (`rfq`/`part`/`quote`/`job`); attaching to applications would 500 because the FK constraint is missing. |
| `0015_intake_conversion.sql` intentionally not applied | Profile materialization on approval | Expected. The `convert_*` functions don't exist; the FK columns linking `*_applications` ↔ `*_profiles` don't exist. Phase 4 ships these together with the FDE review console. |

In all cases the rest of the application continues to function. Apply the
missed migration and the corresponding feature lights up without redeploying
the app.

---

## 8. Rollback

If the deploy needs to be reverted:

1. **App rollback** — Vercel → Deployments → select the prior production
   deploy → "Promote to Production". The old commit is restored without
   touching the database.
2. **Schema rollback** — *not recommended*. The four new migrations are
   additive (new tables, new nullable columns, indexes). No existing column
   was dropped or renamed. Leave them in place even when reverting the app
   to a pre-`5d4db22` build; the older app code ignores them.
3. **Bucket** — leave `launchbelt-documents` in place. An empty private
   bucket has no cost or risk.

---

## 9. Known follow-ups (informational, not deploy-blocking)

- A few legacy form components still use plain `<p className="text-sm
  text-gray-700">` for status messages instead of `<Banner>`. Visual only,
  no functional impact.
- `Softr Screenshots/` lives in the working tree as untracked screenshots.
  Not deployed; safe to leave.
- **Intake schema is in place but unused.** Migrations `0010`–`0014` create
  the application/scoring/operational tables. There is no submit RPC, no
  admin queue, no scoring runner, and no public anonymous flow yet. The
  wizards continue to write only to browser `localStorage`. Phases 2–5
  remaining per `tasks/06_intake_persistence_design.md` §11:
  - Phase 2 — submit RPCs + admin list view
  - Phase 3 — scoring runner + FDE review console
  - Phase 4 — `0015_intake_conversion.sql` + backfill of existing
    `supplier_profiles` rows with synthesized application history
  - Phase 5 — public anonymous intake (rate limit, email verify, CAPTCHA)
- `0015_intake_conversion.sql` lives at `supabase/proposed/0015_intake_conversion.sql`
  and is intentionally outside the Supabase CLI migration scan path. Promote
  by `mv` only when Phase 4 is ready to ship.

---

## Changelog (this release)

| Commit | Description |
|---|---|
| `5f34575` | UI primitives + shell scaffolding |
| `fbd0d1f` | Documents + storage |
| `9da6a90` | Equipment, capabilities, and admin companies directory |
| `bab7fef` | Routing intelligence + KPI system |
| `34b856c` | Notifications |
| `13e0363` | Job activity feed + digital traveler |
| `8aa63e1` | RFQ-level ITAR / CUI overrides |
| `5d4db22` | Dev preview overhaul |
