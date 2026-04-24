import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import ProgramCreateForm from "./ProgramCreateForm";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  try {
    await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">New Program</h1>
      <ProgramCreateForm />
    </main>
  );
}
