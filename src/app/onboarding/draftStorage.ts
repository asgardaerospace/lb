import { type CustomerData } from "./types";

export const DRAFT_KEY = "launchbelt:onboarding:draft:v1";
export const DRAFT_VERSION = 1;

export interface StoredDraft {
  v: number;
  savedAt: string;
  data: CustomerData;
  stepIdx: number;
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
