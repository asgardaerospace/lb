import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApplyCustomerAlias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
  }
  const q = qs.toString();
  redirect(q ? `/onboarding?${q}` : "/onboarding");
}
