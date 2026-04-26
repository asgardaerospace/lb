export const TRAVELER_STEPS = [
  "scheduled",
  "in_production",
  "inspection",
  "complete",
] as const;

export type TravelerStep = (typeof TRAVELER_STEPS)[number];

export interface TravelerStepRow {
  id: string;
  job_id: string;
  step: TravelerStep;
  completed_at: string;
  completed_by: string | null;
  note: string | null;
  created_at: string;
}

export const TRAVELER_LABELS: Record<TravelerStep, string> = {
  scheduled: "Scheduled",
  in_production: "In production",
  inspection: "Inspection",
  complete: "Complete",
};

/**
 * Map a job_status value (which has more granular states) onto its traveler
 * step. Returns null when the status doesn't correspond to a traveler step
 * (e.g. `awarded`, `hold`, `cancelled`).
 */
export function travelerStepForJobStatus(
  status: string,
): TravelerStep | null {
  if (status === "scheduled") return "scheduled";
  if (status === "in_production") return "in_production";
  if (status === "inspection") return "inspection";
  if (status === "shipped" || status === "complete") return "complete";
  return null;
}
