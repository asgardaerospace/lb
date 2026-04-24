# Launchbelt — Local Setup

How to get a Launchbelt dev environment running with Supabase. Every step is
infrastructure only — no application code is modified here.

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

## 3. Supabase project

You have two options. Start with **Local** for development; move to **Hosted**
when you need a shared environment.

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

1. Create a project at https://app.supabase.com.
2. **Project Settings → API**: copy the Project URL, `anon` key, and
   `service_role` key.
3. **Project Settings → Auth → Providers → Email**: make sure Email is
   enabled. For dev, you can turn off "Confirm email" so seeded users can
   sign in without a confirmation link.

---

## 4. Environment variables

Copy the template and fill in the values from step 3:

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
| `SUPABASE_SERVICE_ROLE_KEY` | no (server only) | Bypasses RLS — used only for audit-log writes |

---

## 5. Apply the migration

The schema lives in `supabase/migrations/0001_supplier_profiles.sql`.

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
see step 6.

---

## 6. Seed data

The seed file (`supabase/seed.sql`) creates:

| Entity | ID | Details |
|---|---|---|
| Asgard organization | `00000000-0000-0000-0000-0000000000a1` | `type=asgard`, `itar_registered=true` |
| Supplier organization | `00000000-0000-0000-0000-0000000000b1` | `type=supplier`, `name=Acme Machining` |
| Asgard admin user | `11111111-1111-1111-1111-111111111111` | `admin@asgard.dev` / `asgard-dev-change-me`, role `asgard_admin` |
| Supplier admin user | `22222222-2222-2222-2222-222222222222` | `owner@acme-machining.dev` / `supplier-dev-change-me`, role `supplier_admin` |

Passwords are placeholders — change or rotate before any shared environment.

### 6a. Running seed locally

Nothing to do — `supabase db reset` ran it for you.

### 6b. Running seed against hosted

Option A (psql):

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

`DATABASE_URL` is in **Project Settings → Database → Connection string**.

Option B (Supabase SQL editor): paste the contents of `supabase/seed.sql`
into the editor and run.

Option C (schema drift workaround): if your Supabase auth schema differs
from what `seed.sql` expects, create the two users with the Admin API
instead, then re-run only the `public.organizations` and `public.users`
sections. Example:

```ts
// scripts/seed-auth-users.ts (not committed; local dev only)
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

## 7. Run the app

```bash
npm run dev
# → http://localhost:3000
```

Smoke tests:

- `GET http://localhost:3000/api/me` → `401` when signed out.
- `http://localhost:3000/supplier/profile` → redirect to `/` when signed out.
- `http://localhost:3000/admin/suppliers` → redirect to `/` when signed out.

To actually sign in during dev, either:

- Use the Supabase Studio → Authentication → Users panel to log in as a
  seeded user, or
- Build the login UI (not part of task 01; tracked for a future task).

Once signed in as `admin@asgard.dev`, `/admin/suppliers` renders. Once signed
in as `owner@acme-machining.dev`, `/supplier/profile` renders.

---

## 8. Verifying it works

```bash
npm run lint
npm run build
```

Against the running local stack, in Studio (`http://localhost:54323`):

```sql
select organization_id, email, role from public.users order by role;
-- asgard_admin   | admin@asgard.dev         | asgard org uuid
-- supplier_admin | owner@acme-machining.dev | supplier org uuid

select * from public.organizations;
-- two rows

select * from public.supplier_profiles;
-- zero rows (supplier creates via the UI)
```

---

## 9. Known follow-ups (not part of this setup)

These are not required to get the app running, but will be needed before
production:

1. **Supabase SSR middleware** — `src/middleware.ts` that calls
   `@supabase/ssr` to refresh the session cookie on every navigation. Without
   it, long-lived sessions will expire mid-session. This is application code
   and out of scope for the infra setup task.
2. **Sign-in UI** — `/login` page wired to `supabase.auth.signInWithPassword`.
   Currently you can only sign in via Studio. Scheduled as a standalone task.
3. **Email confirmation flow** — seeded users are created with
   `email_confirmed_at = now()` so confirmation is skipped. Production signup
   must enforce confirmation.
4. **Storage buckets** — `01_ARCHITECTURE.md §2.4` requires private Supabase
   Storage buckets for CAD / drawings / certifications. Not used by task 01
   and not yet provisioned.
5. **Rotating seed passwords** — the placeholders in `supabase/seed.sql` must
   be replaced before any shared environment.

---

## 10. Troubleshooting

**`supabase start` fails with port conflict** — another Supabase instance is
already running. `supabase stop` then restart.

**`insert or update on table "users" violates foreign key constraint` during
seed** — the `public.users` row is being inserted before the matching
`auth.users` row. The provided `seed.sql` inserts in the correct order inside
a transaction; if you split it, keep that order.

**`column "confirmation_token" does not exist`** — your Supabase CLI is
older than the schema `seed.sql` targets. Upgrade (`supabase --version`,
then `npm i -g supabase@latest` or Homebrew) or use the Admin API
alternative in §6.

**`GET /api/me` returns 500 "Supabase env missing"** — `.env.local` is not
loaded. Restart `npm run dev` after creating it.

**Signed in via Studio but API routes still return 401** — Studio and the
Next.js app do not share a session. You need a browser session on
`localhost:3000`. Until the login UI exists, the easiest path is to use the
Supabase JS client from the browser console to call
`signInWithPassword({ email, password })`.
