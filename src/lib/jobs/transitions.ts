import type { JobStatus } from "@/lib/jobs/types";

// Computes side-effect date patches to apply when transitioning to a given
// status. Mirrors the expectation in /tasks/05_job_execution_tracking.md that
// start_date and completed_date track the lifecycle.
export function sideEffectDates(
  next: JobStatus,
  current: { start_date: string | null; completed_date: string | null },
): { start_date?: string | null; completed_date?: string | null } {
  const today = new Date().toISOString().slice(0, 10);
  const patch: { start_date?: string | null; completed_date?: string | null } = {};
  if (next === "in_production" && current.start_date == null) {
    patch.start_date = today;
  }
  if (next === "complete" && current.completed_date == null) {
    patch.completed_date = today;
  }
  return patch;
}
