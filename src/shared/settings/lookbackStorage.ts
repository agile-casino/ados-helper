const DEFAULT_LOOKBACK_HOURS = 24;
export const MIN_LOOKBACK_HOURS = 1;
export const MAX_LOOKBACK_HOURS = 24 * 30;

const STORAGE_KEY_PREFIX = "sprint-report-generator-lookback-hours-";

const getStorageKey = (collection: string, project: string): string => `${STORAGE_KEY_PREFIX}${collection}-${project}`;

export const clampLookbackHours = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_LOOKBACK_HOURS;
  return Math.min(MAX_LOOKBACK_HOURS, Math.max(MIN_LOOKBACK_HOURS, Math.round(value)));
};

export const loadLookbackHours = (collection: string, project: string): number => {
  try {
    const stored = localStorage.getItem(getStorageKey(collection, project));
    if (stored !== null) return clampLookbackHours(Number(stored));
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_LOOKBACK_HOURS;
};

export const saveLookbackHours = (collection: string, project: string, hours: number): void => {
  try {
    localStorage.setItem(getStorageKey(collection, project), String(clampLookbackHours(hours)));
  } catch {
    // Ignore storage errors
  }
};
