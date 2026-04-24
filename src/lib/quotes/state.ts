import type { QuoteStatus } from "@/lib/quotes/types";

// Task 04 chain: draft → submitted → under_review → accepted
// plus rejected (admin-terminal) and declined (supplier-terminal).
const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["submitted", "declined"],
  submitted: ["under_review", "accepted", "rejected"],
  under_review: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  declined: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const REVIEWABLE: QuoteStatus[] = ["submitted", "under_review"];
