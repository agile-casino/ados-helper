// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_WORK_ITEM_STATE_CONFIG } from "../domain/WorkItemState";
import { loadStateConfig, resetStateConfig, saveStateConfig } from "./stateConfigStorage";

const collection = "coll";
const project = "proj";
const key = `sprint-report-generator-state-config-${collection}-${project}`;

beforeEach(() => {
  localStorage.clear();
});

describe("stateConfigStorage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadStateConfig(collection, project)).toEqual(DEFAULT_WORK_ITEM_STATE_CONFIG);
  });

  it("round-trips a saved config", () => {
    const config = { states: { New: "Not Started" as const, "In Review": "In Progress" as const } };

    saveStateConfig(collection, project, config);

    expect(loadStateConfig(collection, project)).toEqual(config);
  });

  it("returns defaults for invalid JSON", () => {
    localStorage.setItem(key, "{ not json");

    expect(loadStateConfig(collection, project)).toEqual(DEFAULT_WORK_ITEM_STATE_CONFIG);
  });

  it("returns defaults for an invalid category", () => {
    localStorage.setItem(key, JSON.stringify({ states: { New: "Bogus" } }));

    expect(loadStateConfig(collection, project)).toEqual(DEFAULT_WORK_ITEM_STATE_CONFIG);
  });

  it("reset restores and persists defaults", () => {
    saveStateConfig(collection, project, { states: { "In Review": "Done" } });

    const reset = resetStateConfig(collection, project);

    expect(reset).toEqual(DEFAULT_WORK_ITEM_STATE_CONFIG);
    expect(loadStateConfig(collection, project)).toEqual(DEFAULT_WORK_ITEM_STATE_CONFIG);
  });

  it("returns a fresh clone of defaults", () => {
    const loaded = loadStateConfig(collection, project);
    loaded.states["New"] = "Done";

    expect(DEFAULT_WORK_ITEM_STATE_CONFIG.states["New"]).toBe("Not Started");
  });
});
