# Launchbelt — MVP Validation Checklist

End-to-end validation for Tasks 01–05. Work through the steps in order. The
seed in `supabase/seed.sql` creates the users and orgs referenced below;
`/docs/08_SUPABASE_SETUP.md` covers how to bring up the Supabase stack.

---

## 0. Pre-flight

- [ ] Repo at `origin/main`; `git log --oneline -1` shows the stabilization
      commit or later.
- [ ] `npm install` clean.
- [ ] `npm run lint` clean.
- [ ] `npm run build` clean; 63+ routes registered.
- [ ] `.env.local` populated with:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase stack running (`supabase start` for local, or hosted project
      linked).
- [ ] Migrations applied: `supabase db reset` (local) or
      `supabase db push` + seed via psql/SQL editor (hosted).
- [ ] Seed data present — run in Supabase Studio:
      ```sql
      select count(*) from organizations;      -- expect 3
      select count(*) from users;              -- expect 3
      select count(*) from supplier_profiles;  -- expect 1 (approved)
      ```

---

## 1. Authentication

Until the login UI lands, sign in from the browser console. For each role,
follow the three-line recipe in `08_SUPABASE_SETUP.md §7`.

| Role | Email | Password |
|---|---|---|
| Asgard admin | `admin@asgard.dev` | `asgard-dev-change-me` |
| Supplier admin | `owner@acme-machining.dev` | `supplier-dev-change-me` |
| Buyer admin | `planner@falconworks.dev` | `buyer-dev-change-me` |

Per role, verify:

- [ ] Signed-in `GET /api/me` returns the expected `organization_id` and `role`.
- [ ] Signed-out `GET /api/me` returns `401`.

---

## 2. Supplier profile flow (Task 01)

Sign in as **supplier admin** (`owner@acme-machining.dev`).

- [ ] Visit `/supplier/profile`. Seeded profile is already `approved`.
- [ ] The form is **read-only** because `approved` is terminal. The page
      still renders without error.
- [ ] (Optional) To exercise the review flow, set the seeded profile's
      `approval_status = 'draft'` via SQL, then:
      - [ ] Edit profile fields, "Save draft" persists.
      - [ ] "Submit for review" transitions to `submitted`.
      - [ ] Sign in as **asgard admin**, visit `/admin/suppliers`, see
            Acme in the queue.
      - [ ] Approve → profile returns to `approved`.
      - [ ] Audit log rows exist (Studio SQL):
            ```sql
            select action, metadata from audit_logs
             where entity_type='supplier_profile'
             order by timestamp desc limit 5;
            ```

---

## 3. Buyer program + RFQ flow (Task 02)

Sign in as **buyer admin** (`planner@falconworks.dev`).

- [ ] `/buyer/dashboard` loads. No programs or RFQs yet.
- [ ] Click **New program**. Fill out name, type, description, compliance
      flags (leave ITAR off for simplicity). Submit.
- [ ] Redirected to `/buyer/programs/<id>`. Program shown with status
      `active`.
- [ ] Create an RFQ under the program. Title, quantity, priority, need-by
      date. Submit.
- [ ] Redirected to `/buyer/rfqs/<id>`. Status `draft`.
- [ ] Add ≥ 1 part (part number, material, process, quantity).
- [ ] **Try to submit with no parts first** to confirm the guard — remove
      all parts, click Submit for routing → expect `409` /
      "RFQ must have at least one part before submission".
- [ ] Re-add a part, Submit for routing. RFQ transitions `draft → submitted`.
      Editor becomes read-only.
- [ ] `/buyer/dashboard` shows the RFQ in `submitted`.
- [ ] Audit log check:
      ```sql
      select action from audit_logs
       where organization_id='00000000-0000-0000-0000-0000000000c1'
       order by timestamp desc limit 5;
      -- expect rfq.submitted, rfq.created, program.created
      ```

---

## 4. Admin routing console (Task 03)

Sign in as **asgard admin**.

- [ ] `/admin/rfqs` shows the newly submitted RFQ (task-02-owned view).
- [ ] `/admin/routing` shows the routing queue with the same RFQ.
- [ ] Click into the RFQ (`/admin/routing/rfqs/<id>`). Parts render.
- [ ] Create a work package (name, type, description).
- [ ] Redirected to `/admin/work-packages/<wpId>`. RFQ's status in the DB
      should now be `routing_in_progress`:
      ```sql
      select status from rfqs where id='<rfq id>';
      ```
- [ ] Attach ≥ 1 part from the available-parts list.
- [ ] **Candidate list** shows Acme Machining (because its supplier
      profile is `approved`).
- [ ] Record a routing decision for Acme: fill fit scores 0–100, rationale.
      Decision appears with status `pending`.
- [ ] Click **Request quote**. Status becomes `quote_requested`, and the
      parent RFQ transitions `routing_in_progress → quotes_requested`:
      ```sql
      select status, quote_requested_at from routing_decisions
       where work_package_id='<wp id>';
      select status from rfqs where id='<rfq id>';
      ```
- [ ] Audit log:
      ```sql
      select action, metadata from audit_logs
       where entity_type in ('work_package','routing_decision')
       order by timestamp desc limit 5;
      -- expect routing_decision.quote_requested, routing_decision.created,
      --        work_package.created
      ```

---

## 5. Supplier quote workflow (Task 04)

Sign in as **supplier admin**.

- [ ] `/supplier/quote-requests` (task 03 page) shows the request.
- [ ] `/supplier/quotes` (task 04 inbox) also shows the request, status
      `awaiting response`.
- [ ] Click into the request. Part list visible.
- [ ] **Decline path (optional)**: Click **Decline request**, confirm.
      A quote row is created with `status = declined`, `quote.declined`
      audit event emitted. Skip the happy path below and re-seed to
      retry.
- [ ] **Happy path**: Fill price, lead time, MOQ, notes. Submit.
- [ ] Quote appears with status `submitted`.
- [ ] SQL verify one-quote-per-request invariant:
      ```sql
      select count(*) from quotes
       where work_package_id='<wp id>'
         and supplier_organization_id='00000000-0000-0000-0000-0000000000b1';
      -- expect 1
      ```
- [ ] Audit log: `quote.submitted` with `routing_decision_id`,
      `work_package_id`, `quoted_price`, `lead_time_days` in metadata.

---

## 6. Admin quote acceptance (Task 04)

Sign in as **asgard admin**.

- [ ] `/admin/quotes` lists the submitted quote.
- [ ] Click into it (`/admin/quotes/<id>`). Part list, supplier name,
      submitted fields all visible.
- [ ] **Reject path (optional)**: Reject → status becomes `rejected`,
      `quote.rejected` audit row emitted. Re-seed to retry.
- [ ] **Happy path**: Add a brief review note, click **Accept (create job)**.
- [ ] Success message names the new job id. Quote status becomes `accepted`.
- [ ] SQL: one job row now exists with status `awarded`:
      ```sql
      select id, job_number, status, due_date, quote_id
        from jobs order by created_at desc limit 1;
      ```
- [ ] Audit log shows `quote.accepted` AND `job.created` from the same
      handler call.
- [ ] `due_date` on the job matches the RFQ's `required_delivery_date`
      (if one was set).

---

## 7. Supplier job status updates (Task 05)

Sign in as **supplier admin**.

- [ ] `/supplier/jobs` shows the new job. `job_number` starts with `LB-`.
- [ ] Click into the job (`/supplier/jobs/<id>`). Status `awarded`.
- [ ] Advance once: **Mark scheduled**. Status → `scheduled`. Audit row
      `job.status_updated` emitted.
- [ ] Advance: **Start production** → `in_production`. `start_date`
      stamped to today.
- [ ] Advance through `inspection` → `shipped` → `complete`. On the move to
      `complete`, `completed_date` stamped to today.
- [ ] Flag an issue along the way (e.g. during `in_production`). Verify
      `last_issue_note` + `last_issue_flagged_at` set on the job and a
      `job.issue_flagged` audit row emitted.
- [ ] **Negative test**: try calling `POST /api/supplier/jobs/<id>/status`
      with `status: "awarded"` after the job is `scheduled` — expect `409`
      (forward-only supplier transitions).

---

## 8. Admin override + risk flag (Task 05)

Sign in as **asgard admin**.

- [ ] `/admin/jobs` lists the job.
- [ ] Visit `/admin/jobs/<id>`. Override status to `in_production` (or
      any-to-any). Audit row `job.status_overridden` emitted with
      `previous_status`, `next_status`, and optional note.
- [ ] Flag a risk with a note → `job.issue_flagged` audit row emitted,
      `flagged_by_role: asgard_admin` in metadata.

---

## 9. Buyer program status visibility (Tasks 02 + 05)

Sign in as **buyer admin**.

- [ ] `/buyer/dashboard` — RFQ status reflects the state driven by admin
      actions (`quotes_requested` after task-03 quote requests).
- [ ] `/buyer/jobs` lists the job created for the RFQ, read-only, with
      status matching whatever the supplier / admin last set.
- [ ] Buyer UI should NOT expose:
      - Routing rationale
      - Competing supplier identity (there is none yet, but confirm only
        one supplier org name appears if you seed additional quotes)
      - Quote prices or lead times (there is no buyer-quote route today —
        confirm none can be navigated to)
- [ ] Attempting to visit any `/admin/*` or `/supplier/*` URL as buyer
      should redirect to `/` or return `404`/`403`.

---

## 10. Cross-org isolation

### 10a. Buyer cannot see another buyer's data

Not directly testable without a second buyer org. Create one in Studio:

```sql
insert into organizations (name, type) values ('Second Buyer', 'buyer')
  returning id;
```

Create a second buyer user (Studio → Authentication → Users → Add user)
linked to that org. Then:

- [ ] As the second buyer, `/buyer/dashboard` shows empty — none of
      Falcon Works' programs are visible.
- [ ] As the second buyer, `GET /api/buyer/programs/<falcon-program-id>`
      returns 403.
- [ ] As the second buyer, `GET /api/buyer/jobs` returns empty.

### 10b. Supplier cannot see another supplier's data

Create a second supplier org + user similarly. Seed a second
`supplier_profiles` row (`approved`). As asgard admin, add the second
supplier as a routing candidate on the same work package and
**request-quote** them. Then:

- [ ] Sign in as the first supplier. `/supplier/quote-requests` still
      shows only their own request; the second supplier's routing
      decision is not visible.
- [ ] `GET /api/supplier/quote-requests` response JSON contains only
      one entry and never names the other supplier.
- [ ] `loadRequestForSupplier` guard verified: the first supplier
      calling `POST /api/supplier/quote-requests/<other-rd-id>/decline`
      returns `403`.

### 10c. Supplier cannot see competing quotes

After both suppliers have submitted quotes:

- [ ] First supplier's `/supplier/quotes` inbox shows only their own quote.
- [ ] `select count(*) from quotes` returns 2; but a supplier's API calls
      return 1.
- [ ] Direct Supabase query from the first supplier's session should
      fail on the second supplier's quote row (RLS).

---

## 11. Audit log coverage

Every critical transition below should have exactly one row in
`audit_logs`. SQL sanity check (after running through all flows):

```sql
select action, count(*) from audit_logs
 group by action order by action;
```

Expected actions (at least one each after a full happy-path run):

| Action | Source task |
|---|---|
| `supplier_profile.submitted` | Task 01 (optional re-seed flow) |
| `supplier_profile.approved` | Task 01 (optional) |
| `program.created` | Task 02 |
| `rfq.created` | Task 02 |
| `rfq.submitted` | Task 02 |
| `work_package.created` | Task 03 |
| `routing_decision.created` | Task 03 |
| `routing_decision.quote_requested` | Task 03 |
| `quote.submitted` | Task 04 |
| `quote.accepted` | Task 04 |
| `job.created` | Task 04 (from accept handler) |
| `job.status_updated` | Task 05 (supplier advance) |
| `job.status_overridden` | Task 05 (admin override) |
| `job.issue_flagged` | Task 05 |

Gap to flag during validation:

- [ ] RFQ status transitions (`submitted → routing_in_progress`,
      `routing_in_progress → quotes_requested`) are **not** audited as
      `rfq.*` events — they appear only in `work_package.created` and
      `routing_decision.quote_requested` metadata. Note this to whoever
      reviews audit completeness.

---

## 12. Access-control spot checks

For each endpoint, attempting it with the wrong role should return
`401` or `403`, not `200`.

- [ ] Unauthenticated GET `/api/me` → 401.
- [ ] Buyer calls `POST /api/admin/quotes/<id>/accept` → 403.
- [ ] Supplier calls `POST /api/buyer/programs` → 403.
- [ ] `supplier_user` (read-only supplier role, if seeded) calls
      `POST /api/supplier/profile/submit` → 403.
- [ ] Buyer hits `GET /api/admin/rfqs` → 403.
- [ ] Supplier hits `GET /api/admin/routing/queue` → 403.

---

## 13. Known non-blockers

These are documented gaps — not blockers for validation but worth noting:

- Login UI missing; sign-in via browser console per `08_SUPABASE_SETUP.md §7`.
- SSR middleware for session refresh not installed; long sessions will
  expire mid-flow.
- Document-upload placeholder UI; no real storage layer wired.
- RFQ never transitions to `awarded` / `closed`; stays at
  `quotes_requested` after job creation. The full chain from
  `04_WORKFLOWS.md §12` is only implemented through `quotes_requested`.
- Part-level lifecycle (`draft → routed → in_production → complete`) is
  not implemented.
- `quotes_select` RLS allows buyers to read quotes on their own RFQs.
  No endpoint exposes this today, but the policy is broader than strictly
  required.
- `certifications`, `machines`, `capabilities`, `documents` tables exist
  but have no CRUD surface yet.

---

## 14. Sign-off

Validator: ____________________ Date: ____________

All boxes checked → MVP is ready for a stakeholder walkthrough.
Any unchecked box → file under "Remaining fixes" before that walkthrough.
