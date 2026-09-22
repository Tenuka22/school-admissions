import type { MarkingCategoryEntry } from "@school-admissions/db/constants/markingVersions/index";

const KEY_PREFIX = "g1-application-draft:";

export interface ApplicationDraft {
  data: Record<string, unknown>;
  entries: MarkingCategoryEntry[];
  /** The step being viewed when this draft was last written. */
  stepIndex: number;
  /** The furthest step reached — resuming a draft returns here, not to step 0. */
  maxStepIndex: number;
  /** ISO timestamp of the last local write, for surfacing "last saved" if ever needed. */
  savedAt: string;
}

/**
 * The wizard is a local-first form: every field edit is written here
 * immediately, keyed by the application's own id/uuid, so reloading or
 * returning to `/applications/$id` resumes exactly where you left off —
 * nothing round-trips to the server until the applicant actually submits.
 */
export function loadDraft(applicationId: string): ApplicationDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + applicationId);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("data" in parsed) ||
      !("entries" in parsed)
    ) {
      return null;
    }
    return parsed as ApplicationDraft;
  } catch {
    return null;
  }
}

export function saveDraft(
  applicationId: string,
  draft: Pick<ApplicationDraft, "data" | "entries" | "stepIndex" | "maxStepIndex">
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      KEY_PREFIX + applicationId,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() })
    );
  } catch {
    // Storage full/unavailable (private browsing etc.) — the in-memory form
    // state still works for this session, it just won't survive a reload.
  }
}

export function clearDraft(applicationId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KEY_PREFIX + applicationId);
}
