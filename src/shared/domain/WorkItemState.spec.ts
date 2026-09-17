import { describe, expect, test } from "vitest";
import { categorizeState, DEFAULT_WORK_ITEM_STATE_CONFIG, WORK_ITEM_CATEGORIES, type WorkItemStateConfig } from "./WorkItemState";

describe("WorkItemState", () => {
  test("default config maps every known PBI state", () => {
    const cases: [string, string][] = [
      ["New", "Not Started"],
      ["Ready", "Not Started"],
      ["Approved", "Not Started"],
      ["Committed", "Not Started"],
      ["Blocked", "In Progress"],
      ["Testing", "In Progress"],
      ["Staging", "In Progress"],
      ["Released", "In Progress"],
      ["Done", "Done"],
      ["Removed", "Removed"]
    ];

    for (const [state, expected] of cases) {
      expect(DEFAULT_WORK_ITEM_STATE_CONFIG.states[state], `${state} should map to ${expected}`).toBe(expected);
    }
  });

  test("categorizeState returns the configured category", () => {
    const config: WorkItemStateConfig = { states: { "In Review": "In Progress" } };
    expect(categorizeState("In Review", config)).toBe("In Progress");
  });

  test("categorizeState falls back to Not Started for unlisted states", () => {
    expect(categorizeState("Something Else", DEFAULT_WORK_ITEM_STATE_CONFIG)).toBe("Not Started");
    expect(categorizeState("Something Else", { states: {} })).toBe("Not Started");
  });

  test("WORK_ITEM_CATEGORIES lists the four supported categories", () => {
    expect(WORK_ITEM_CATEGORIES).toEqual(["Not Started", "In Progress", "Done", "Removed"]);
  });
});
