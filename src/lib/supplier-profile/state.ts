import type { SupplierApprovalStatus } from "@/lib/supplier-profile/types";

// State transitions for supplier_profiles.
// Base chain from /docs/04_WORKFLOWS.md §12: draft → submitted → approved.
// Task 01 extends with under_review, rejected, revisions_requested.
const TRANSITIONS: Record<SupplierApprovalStatus, SupplierApprovalStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "approved", "rejected", "revisions_requested"],
  under_review: ["approved", "rejected", "revisions_requested"],
  revisions_requested: ["submitted"],
  approved: [],
  rejected: [],
};

export function canTransition(
  from: SupplierApprovalStatus,
  to: SupplierApprovalStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const EDITABLE_STATES: SupplierApprovalStatus[] = [
  "draft",
  "revisions_requested",
];

export const REVIEWABLE_STATES: SupplierApprovalStatus[] = [
  "submitted",
  "under_review",
];
