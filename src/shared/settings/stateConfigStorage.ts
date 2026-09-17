import { z } from "zod";
import { DEFAULT_WORK_ITEM_STATE_CONFIG, WORK_ITEM_CATEGORIES, type WorkItemStateConfig } from "../domain/WorkItemState";

const StateConfigSchema = z.object({
  states: z.record(z.string(), z.enum(WORK_ITEM_CATEGORIES))
});

const STORAGE_KEY_PREFIX = "sprint-report-generator-state-config-";

const getStorageKey = (collection: string, project: string): string => {
  return `${STORAGE_KEY_PREFIX}${collection}-${project}`;
};

const defaultStateConfig = (): WorkItemStateConfig => ({
  states: { ...DEFAULT_WORK_ITEM_STATE_CONFIG.states }
});

export const loadStateConfig = (collection: string, project: string): WorkItemStateConfig => {
  try {
    const stored = localStorage.getItem(getStorageKey(collection, project));
    if (stored) {
      const parsed = StateConfigSchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore storage/parse errors and fall back to defaults.
  }
  return defaultStateConfig();
};

export const saveStateConfig = (collection: string, project: string, config: WorkItemStateConfig): void => {
  try {
    localStorage.setItem(getStorageKey(collection, project), JSON.stringify(config));
  } catch {
    // Ignore storage errors.
  }
};

export const resetStateConfig = (collection: string, project: string): WorkItemStateConfig => {
  const defaults = defaultStateConfig();
  saveStateConfig(collection, project, defaults);
  return defaults;
};
