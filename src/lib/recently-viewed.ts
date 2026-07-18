/**
 * Recently-viewed products — client-side only, zero backend.
 *
 * Stored in localStorage (origin-scoped, so automatically per store since
 * every store lives on its own subdomain). Presigned image URLs expire
 * after a while; the strip component falls back to a placeholder when an
 * image no longer loads.
 */

export interface RecentlyViewedEntry {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  viewedAt: number;
}

const STORAGE_KEY = "sf_recently_viewed";
const MAX_ENTRIES = 12;

/** Stable reference for SSR / empty states (useSyncExternalStore contract) */
const EMPTY_ENTRIES: RecentlyViewedEntry[] = [];

/**
 * Snapshot cache + listeners so the strip can consume the history through
 * useSyncExternalStore (stable references, no setState-in-effect).
 */
let cachedSnapshot: RecentlyViewedEntry[] | null = null;
const listeners = new Set<() => void>();

function notifyChanged(): void {
  cachedSnapshot = null;
  for (const listener of listeners) {
    listener();
  }
}

function readEntries(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return EMPTY_ENTRIES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ENTRIES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_ENTRIES;
    return parsed.filter(
      (entry): entry is RecentlyViewedEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as RecentlyViewedEntry).id === "string" &&
        typeof (entry as RecentlyViewedEntry).name === "string",
    );
  } catch {
    return EMPTY_ENTRIES;
  }
}

/** Subscribe to history changes (useSyncExternalStore subscribe) */
export function subscribeRecentlyViewed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client snapshot, newest first (useSyncExternalStore getSnapshot) */
export function getRecentlyViewedSnapshot(): RecentlyViewedEntry[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readEntries();
  }
  return cachedSnapshot;
}

/** Server snapshot — always empty (strip renders after hydration) */
export function getRecentlyViewedServerSnapshot(): RecentlyViewedEntry[] {
  return EMPTY_ENTRIES;
}

/**
 * Record a product view. Moves an existing entry to the front and caps
 * the list. Never throws (Safari private mode, quota, disabled storage).
 */
export function recordRecentlyViewed(
  entry: Omit<RecentlyViewedEntry, "viewedAt">,
): void {
  if (typeof window === "undefined") return;

  try {
    const entries = readEntries().filter((e) => e.id !== entry.id);
    const next = [{ ...entry, viewedAt: Date.now() }, ...entries].slice(
      0,
      MAX_ENTRIES,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChanged();
  } catch {
    // Storage unavailable — feature silently degrades
  }
}
