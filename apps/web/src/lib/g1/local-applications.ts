const STORAGE_KEY = "g1-applications";

export interface LocalApplicationRef {
  id: string;
  applicationNumber: string;
  createdAt: string;
}

/**
 * No login is required to start or fill in a G1 application — the
 * application's `id` (an unguessable UUID) is its own access key. Since
 * there is no server-side session to list "my applications" from, the
 * browser remembers every application it has created/opened here, the same
 * way aloysius-g1's `saved-applications-store` does.
 */
export function listLocalApplications(): LocalApplicationRef[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LocalApplicationRef[]) : [];
  } catch {
    return [];
  }
}

export function rememberLocalApplication(ref: LocalApplicationRef): void {
  if (typeof window === "undefined") {
    return;
  }
  const existing = listLocalApplications().filter((a) => a.id !== ref.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([ref, ...existing]));
}

export function forgetLocalApplication(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(listLocalApplications().filter((a) => a.id !== id))
  );
}
