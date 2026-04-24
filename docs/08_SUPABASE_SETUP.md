# Launchbelt — Supabase Setup

How to get a Launchbelt dev environment running with Supabase. Every step is
infrastructure only — no application code is modified here. Follow these in
order the first time you clone the repo.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org |
| npm | ≥ 10 | bundled with Node |
| Supabase CLI | ≥ 1.200 | https://supabase.com/docs/guides/cli |
| Docker Desktop | latest | required by the Supabase CLI for the local stack |

Verify:

```bash
node --version
npm --version
supabase --version
docker ps
```

---

## 2. Clone and install

```bash
git clone https://github.com/asgardaerospace/lb.git
cd lb
npm install
```

---

## 3. Create or connect a Supabase project

Two options. Start with **Local** for development; switch to **Hosted** when
you need a shared environment.

### 3a. Local (recommended for first run)

```bash
# from repo root
supabase init           # one-time, creates supabase/config.toml if missing
supabase start          # boots Postgres, Auth, Storage, Studio in Docker
```

When the stack comes up the CLI prints three URLs and three keys. You need:

- **API URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Studio is at http://localhost:54323.

### 3b. Hosted Supabase project

Dashboard steps (must be done in the browser — no CLI equivalent):

1. Go to https://app.supabase.com and create a new project.
2. **Project Settings → API**: copy the Project URL, `anon` key, and
   `service_role` key.
3. **Authentication → Providers → Email**: ensure Email is enabled. For dev,
   toggle off "Confirm email" so seeded users can sign in without a
   confirmation link.
4. **Authentication → URL Configuration**: set Site URL to
   `http://localhost:3000` (dev) or your deployed origin.

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

`.env.local` (gitignored) must contain:

```env
NEXT_PUBLIC_SUPABASE_URL=<from step 3>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 3>
SUPABASE_SERVICE_ROLE_KEY=<from step 3>
```

| Variable | Exposed to browser? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase REST + Auth endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anonymous JWT, respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | no (server only) | Bypasses RLS — used only for audit-log writes from API handlers |

---

## 5. Apply the migration

The schema is committed as `supabase/migrations/0001_supplier_profiles.sql`.

### 5a. Local stack

```bash
supabase db reset
```

This drops the local database, re-runs every SQL file under
`supabase/migrations/`, then runs `supabase/seed.sql`. After it finishes you
have a fresh dev DB with schema + seed data.

### 5b. Hosted project

Link the CLI to your project, then push:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`db push` applies any unapplied migrations. It does **not** run `seed.sql` —
see §6.

---

## 6. Seed test data

The seed file (`supabase/seed.sql`) creates:

| Entity | ID | Details |
|---|---|---|
| Asgard organization | `00000000-0000-0000-0000-0000000000a1` | `type=asgard`, `itar_registered=true`, name `Asgard Aerospace` |
| Supplier organization | `00000000-0000-0000-0000-0000000000b1` | `type=supplier`, name `Acme Machining` |
| Asgard admin user | `11111111-1111-1111-1111-111111111111` | `admin@asgard.dev` / `asgard-dev-change-me`, role `asgard_admin`, status `active` |
| Supplier admin user | `22222222-2222-2222-2222-222222222222` | `owner@acme-machining.dev` / `supplier-dev-change-me`, role `supplier_admin`, status `active` |

The two `public.users` rows share UUIDs with their corresponding `auth.users`
rows — this is how `requireUser` in `src/lib/auth.ts` joins the authenticated
session to an organization and role.

Passwords are placeholders. Rotate them before any shared environment.

### 6a. Running seed locally

Nothing to do — `supabase db reset` ran it for you.

### 6b. Running seed against hosted

Option A — psql:

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

`DATABASE_URL` is in **Project Settings → Database → Connection string**.

Option B — Supabase SQL editor: paste the contents of `supabase/seed.sql`
into the editor and run.

Option C — schema-drift workaround: if your Supabase `auth.users` schema
has drifted from what `seed.sql` expects, create the two users with the
Admin API instead and re-run only the `public.organizations` and
`public.users` sections:

```ts
// scripts/seed-auth-users.ts (local dev only; not committed)
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

await admin.auth.admin.createUser({
  user_id: "11111111-1111-1111-1111-111111111111",
  email: "admin@asgard.dev",
  password: "asgard-dev-change-me",
  email_confirm: true,
});

await admin.auth.admin.createUser({
  user_id: "22222222-2222-2222-2222-222222222222",
  email: "owner@acme-machining.dev",
  password: "supplier-dev-change-me",
  email_confirm: true,
});
```

---

## 7. Run local development

```bash
npm run dev
# → http://localhost:3000
```

Smoke tests (no session):

- `GET http://localhost:3000/api/me` → `401 { "error": "Not authenticated" }`
- `http://localhost:3000/supplier/profile` → redirect to `/`
- `http://localhost:3000/admin/suppliers` → redirect to `/`

To sign in during dev, until a `/login` UI is built:

1. Open http://localhost:3000 and open the browser devtools console.
2. Paste (one block):
   ```js
   const { createBrowserClient } = await import("/node_modules/@supabase/ssr/dist/module/index.js");
   const sb = createBrowserClient(
     "<NEXT_PUBLIC_SUPABASE_URL>",
     "<NEXT_PUBLIC_SUPABASE_ANON_KEY>",
   );
   await sb.auth.signInWithPassword({
     email: "admin@asgard.dev",
     password: "asgard-dev-change-me",
   });
   location.reload();
   ```
3. After reload, `/admin/suppliers` renders for the Asgard admin; swap the
   credentials for `owner@acme-machining.dev` to test the supplier path.

---

## 8. Verifying API routes resolve user, org, and role

Auth resolution is handled end-to-end by [`src/lib/auth.ts`](../src/lib/auth.ts).
The chain for every protected route is:

1. `createServerSupabase()` reads the Supabase session from the request cookies.
2. `supabase.auth.getUser()` returns the `auth.users` row → gives the user id.
3. That id is joined against `public.users` to load `organization_id`, `role`,
   and `status`.
4. `requireRole([...])` gates the handler on `role`.
5. Repository queries filter by `organization_id` from the session (never the
   request body) — backed by RLS policies in
   `supabase/migrations/0001_supplier_profiles.sql`.

Run the build and confirm the routes compile:

```bash
npm run lint
npm run build
```

Against the running local stack (Supabase Studio → SQL editor):

```sql
select id, email, role, organization_id, status
from public.users
order by role;
-- expect two rows:
-- 11111111-… | admin@asgard.dev         | asgard_admin   | …0a1 | active
-- 22222222-… | owner@acme-machining.dev | supplier_admin | …0b1 | active

select id, name, type, itar_registered from public.organizations;
-- expect two rows (asgard, supplier)

select * from public.supplier_profiles;
-- expect zero rows (supplier creates one via the UI)
```

After signing in as the Asgard admin:

```
GET /api/me
→ 200 { "id": "11111111-…", "organization_id": "…0a1", "email": "admin@asgard.dev", "role": "asgard_admin" }

GET /api/admin/supplier-profiles
→ 200 { "profiles": [] }

GET /api/supplier/profile
→ 403 { "error": "Forbidden" }   (wrong role, correctly rejected)
```

After signing in as the supplier admin:

```
GET /api/me
→ 200 { "role": "supplier_admin", "organization_id": "…0b1", … }

GET /api/supplier/profile
→ 200 { "profile": null }   (no profile yet)

PUT /api/supplier/profile
→ 200 with the saved profile
```

---

## 9. Known follow-ups (not part of this setup)

Not required to get the app running, but needed before production:

1. **Supabase SSR middleware** — `src/middleware.ts` that calls `@supabase/ssr`
   to refresh the session cookie on every navigation. Without it, long-lived
   sessions expire mid-session. Application code; out of scope here.
2. **Sign-in UI** — a `/login` route wired to
   `supabase.auth.signInWithPassword`. Currently you sign in by running the
   JS snippet in §7 from the browser console.
3. **Email confirmation flow** — seeded users bypass email confirmation
   (`email_confirmed_at = now()`). Production signup must enforce it.
4. **Storage buckets** — `01_ARCHITECTURE.md §2.4` requires private Supabase
   Storage buckets for CAD / drawings / certifications. Not used by task 01.
5. **Rotating seed passwords** before any shared environment.

---

## 10. Troubleshooting

**`supabase start` fails with port conflict** — another Supabase instance is
running. `supabase stop` then retry.

**FK violation during seed** — `public.users` row inserted before its matching
`auth.users` row. `seed.sql` inserts in the correct order inside a
transaction; if you split it, preserve that order.

**`column "confirmation_token" does not exist`** — your Supabase CLI is older
than the `auth.users` schema that `seed.sql` targets. Upgrade the CLI or use
the Admin API alternative in §6.

**`GET /api/me` returns 500 "Supabase env missing"** — `.env.local` is not
loaded. Stop and restart `npm run dev` after creating it.

**Signed in via Studio but API routes still return 401** — Studio and the
Next.js app do not share a session. You need a session cookie on
`localhost:3000`. Use the browser-console snippet in §7.
