import type { RfqStatus } from "@/lib/rfq/types";

// Task 02 covers only the first transition of the RFQ lifecycle from
// /docs/04_WORKFLOWS.md §12. Later tasks (routing, quoting, award, close)
// extend this map along with the `rfq_status` enum in a new migration.
const TRANSITIONS: Record<RfqStatus, RfqStatus[]> = {
  draft: ["submitted"],
  submitted: [],
};

export function canTransition(from: RfqStatus, to: RfqStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const EDITABLE_STATES: RfqStatus[] = ["draft"];
