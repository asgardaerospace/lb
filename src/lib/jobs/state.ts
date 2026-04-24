import type { JobStatus } from "@/lib/jobs/types";

// Forward-only transitions available to the supplier, per task 05 and
// /docs/04_WORKFLOWS.md §12. Admin overrides bypass this map.
const SUPPLIER_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  awarded: ["scheduled"],
  scheduled: ["in_production"],
  in_production: ["inspection"],
  inspection: ["shipped"],
  shipped: ["complete"],
  complete: [],
};

export function canSupplierTransition(
  from: JobStatus,
  to: JobStatus,
): boolean {
  return SUPPLIER_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALL_JOB_STATUSES: JobStatus[] = [
  "awarded",
  "scheduled",
  "in_production",
  "inspection",
  "shipped",
  "complete",
];
