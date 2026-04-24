import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-8">
      <h1 className="text-4xl font-semibold tracking-tight">Launchbelt</h1>
      <p className="mt-2 text-sm text-gray-600">
        Aerospace manufacturing orchestration — MVP build.
      </p>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
          Role entry points
        </h2>
        <ul className="space-y-2 text-base">
          <li>
            <Link href="/admin/routing" className="underline">
              Asgard admin
            </Link>
            <span className="ml-2 text-xs text-gray-500">
              routing console, supplier approvals, quote review, job oversight
            </span>
          </li>
          <li>
            <Link href="/supplier/quotes" className="underline">
              Supplier
            </Link>
            <span className="ml-2 text-xs text-gray-500">
              profile, quote requests, jobs
            </span>
          </li>
          <li>
            <Link href="/buyer/dashboard" className="underline">
              Buyer (OEM)
            </Link>
            <span className="ml-2 text-xs text-gray-500">
              programs, RFQs, job progress
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          Unauthenticated visits redirect back here. Sign-in UI is not yet
          built — see{" "}
          <code className="rounded bg-gray-100 px-1">
            docs/08_SUPABASE_SETUP.md §7
          </code>{" "}
          for the dev sign-in flow.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
          Status
        </h2>
        <p className="text-sm">
          Tasks 01–05 implemented: supplier profile, buyer RFQ intake, admin
          routing console, supplier quote workflow, job execution tracking.
          End-to-end validation checklist at{" "}
          <code className="rounded bg-gray-100 px-1">
            docs/09_MVP_VALIDATION_CHECKLIST.md
          </code>
          .
        </p>
      </section>
    </main>
  );
}
