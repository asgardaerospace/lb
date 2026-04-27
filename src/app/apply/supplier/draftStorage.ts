import type { SupplierApplicationPayload } from "@/lib/supplier-application/types";

export const DRAFT_KEY = "launchbelt:supplier-intake:draft:v1";
export const SUBMISSION_KEY = "launchbelt:supplier-intake:lastSubmission:v1";
export const DRAFT_VERSION = 1;

export interface StoredSupplierDraft {
  v: number;
  savedAt: string;
  payload: SupplierApplicationPayload;
  intakeEmail: string;
}

export interface StoredSupplierSubmission {
  v: number;
  submittedAt: string;
  applicationId: string | null;
  status: string | null;
  legalName: string | null;
  previewMode: boolean;
  payload: SupplierApplicationPayload;
}

export function loadDraft(): StoredSupplierDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSupplierDraft;
    if (parsed?.v !== DRAFT_VERSION || !parsed.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(
  payload: SupplierApplicationPayload,
  intakeEmail: string,
) {
  if (typeof window === "undefined") return new Date();
  const savedAt = new Date();
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        v: DRAFT_VERSION,
        savedAt: savedAt.toISOString(),
        payload,
        intakeEmail,
      } satisfies StoredSupplierDraft),
    );
  } catch {
    // ignore quota/private-mode failures
  }
  return savedAt;
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function saveSubmission(s: Omit<StoredSupplierSubmission, "v" | "submittedAt"> & { submittedAt?: string }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SUBMISSION_KEY,
      JSON.stringify({
        v: DRAFT_VERSION,
        submittedAt: s.submittedAt ?? new Date().toISOString(),
        applicationId: s.applicationId,
        status: s.status,
        legalName: s.legalName,
        previewMode: s.previewMode,
        payload: s.payload,
      } satisfies StoredSupplierSubmission),
    );
  } catch {
    // ignore
  }
}

export function loadSubmission(): StoredSupplierSubmission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSupplierSubmission;
    if (parsed?.v !== DRAFT_VERSION || !parsed.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSubmission() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUBMISSION_KEY);
  } catch {
    // ignore
  }
}

export function blankPayload(): SupplierApplicationPayload {
  return {
    company: {
      legal_name: "",
      dba: null,
      website: null,
      hq_city: null,
      hq_state: null,
      hq_country: "US",
      team_size: null,
      year_founded: null,
      duns: null,
      cage: null,
    },
    facility: {},
    compliance: {
      itar_registered: false,
      cmmc_level: "none",
    },
    primary_processes: [],
    capabilities: [],
    machines: [],
    certifications: [],
    past_performance: [],
  };
}
