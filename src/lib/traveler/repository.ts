import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { TravelerStep, TravelerStepRow } from "./types";

const COLUMNS =
  "id, job_id, step, completed_at, completed_by, note, created_at";

export async function listStepsForJob(
  jobId: string,
): Promise<TravelerStepRow[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("job_traveler_steps")
    .select(COLUMNS)
    .eq("job_id", jobId)
    .order("completed_at", { ascending: true });
  if (error) throw new Error(`Traveler list failed: ${error.message}`);
  return (data ?? []) as TravelerStepRow[];
}

/**
 * Record a traveler-step completion for a job. Idempotent: re-recording the
 * same (job_id, step) is a no-op thanks to the unique index. Errors are
 * surfaced to the caller — wire this through best-effort try/catch in status
 * handlers so a traveler write failure doesn't roll back the status update.
 */
export async function recordStep(input: {
  job_id: string;
  step: TravelerStep;
  completed_by: string | null;
  note?: string | null;
}): Promise<void> {
  const sb = createServiceSupabase();
  const { error } = await sb.from("job_traveler_steps").insert({
    job_id: input.job_id,
    step: input.step,
    completed_by: input.completed_by,
    note: input.note ?? null,
  });
  if (error) {
    // Unique-violation: step already recorded, treat as no-op.
    if (error.code === "23505") return;
    throw new Error(`Traveler insert failed: ${error.message}`);
  }
}

/**
 * Tolerant variant for use inside status-update handlers — never throws,
 * logs in dev only. The traveler is a side-effect ledger; a failure to write
 * one row shouldn't reverse the underlying job-status transition.
 */
export async function recordStepBestEffort(input: {
  job_id: string;
  step: TravelerStep;
  completed_by: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    await recordStep(input);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[traveler] recordStep failed:", err);
    }
  }
}
