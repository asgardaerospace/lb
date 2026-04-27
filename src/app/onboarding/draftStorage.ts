import { type CustomerData } from "./types";

export const DRAFT_KEY = "launchbelt:onboarding:draft:v1";
export const DRAFT_VERSION = 1;

export const SUBMISSION_KEY = "launchbelt:onboarding:lastSubmission:v1";

export interface StoredDraft {
  v: number;
  savedAt: string;
  data: CustomerData;
  stepIdx: number;
}

export interface StoredSubmission {
  v: number;
  submittedAt: string;
  applicationId: string | null;
  status: string | null;
  derivedTier: string | null;
  previewMode: boolean;
  // Snapshot of the data we submitted, so the confirmation page can render
  // it even after the draft has been cleared.
  data: CustomerData;
}

export function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed?.v !== DRAFT_VERSION || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(data: CustomerData, stepIdx: number) {
  if (typeof window === "undefined") return new Date();
  const savedAt = new Date();
  const payload: StoredDraft = {
    v: DRAFT_VERSION,
    savedAt: savedAt.toISOString(),
    data,
    stepIdx,
  };
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — silently degrade
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

export function saveSubmission(s: Omit<StoredSubmission, "v" | "submittedAt"> & {
  submittedAt?: string;
}) {
  if (typeof window === "undefined") return;
  const payload: StoredSubmission = {
    v: DRAFT_VERSION,
    submittedAt: s.submittedAt ?? new Date().toISOString(),
    applicationId: s.applicationId,
    status: s.status,
    derivedTier: s.derivedTier,
    previewMode: s.previewMode,
    data: s.data,
  };
  try {
    window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadSubmission(): StoredSubmission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSubmission;
    if (parsed?.v !== DRAFT_VERSION || !parsed.data) return null;
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
