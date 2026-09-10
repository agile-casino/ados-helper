import { z } from "zod";
import { salvageArray } from "../api/schemas";

const TeamSelectionSchema = z.object({
  name: z.string(),
  selected: z.boolean(),
  // Old entries may carry `null`; keep them rather than discarding the team.
  backgroundColor: z.string().nullish()
});

export type TeamSelection = z.infer<typeof TeamSelectionSchema>;

const STORAGE_KEY_PREFIX = "sprint-report-generator-multi-team-";

const getStorageKey = (collection: string, project: string): string => {
  return `${STORAGE_KEY_PREFIX}${collection}-${project}`;
};

export const loadTeamsFromStorage = (collection: string, project: string): TeamSelection[] | null => {
  try {
    const key = getStorageKey(collection, project);
    let stored = localStorage.getItem(key);
    if (!stored) {
      // Fallback to old storage key prefix
      stored = localStorage.getItem(`ados-helper-multi-team-${collection}-${project}`);
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      // Salvage valid entries; only fall back to the current team when none remain.
      const teams = salvageArray(TeamSelectionSchema, parsed, "teamStorage");
      return teams.length > 0 ? teams : null;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

export const saveTeamsToStorage = (collection: string, project: string, teams: TeamSelection[]): void => {
  try {
    localStorage.setItem(getStorageKey(collection, project), JSON.stringify(teams));
  } catch {
    // Ignore storage errors
  }
};
