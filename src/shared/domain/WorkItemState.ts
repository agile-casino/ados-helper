const DONE_STATES = ["Done", "Staging", "Released"];
const IN_PROGRESS_STATES = ["Blocked", "Testing"];
const REMOVED_STATE = "Removed";

export const KNOWN_PBI_STATES = ["New", "Ready", "Approved", "Blocked", "Committed", "Testing", "Staging", "Released", "Done", "Removed"] as const;

export const WORK_ITEM_CATEGORIES = ["Not Started", "In Progress", "Done", "Removed"] as const;

export type WorkItemCategory = (typeof WORK_ITEM_CATEGORIES)[number];

export interface WorkItemStateConfig {
  states: Record<string, WorkItemCategory>;
}

function buildDefaultStates(): Record<string, WorkItemCategory> {
  const states: Record<string, WorkItemCategory> = {};
  for (const state of KNOWN_PBI_STATES) {
    states[state] = "Not Started";
  }
  for (const state of IN_PROGRESS_STATES) {
    states[state] = "In Progress";
  }
  for (const state of DONE_STATES) {
    states[state] = "Done";
  }
  states[REMOVED_STATE] = "Removed";
  return states;
}

export const DEFAULT_WORK_ITEM_STATE_CONFIG: WorkItemStateConfig = {
  states: buildDefaultStates()
};

export function categorizeState(state: string, config: WorkItemStateConfig): WorkItemCategory {
  return config.states[state] ?? "Not Started";
}
