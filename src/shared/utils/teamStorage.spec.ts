// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadTeamsFromStorage, saveTeamsToStorage } from "./teamStorage";

const collection = "coll";
const project = "proj";
const key = `sprint-report-generator-multi-team-${collection}-${project}`;

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("teamStorage", () => {
  it("round-trips a valid team array", () => {
    const teams = [
      { name: "Team A", selected: true, backgroundColor: "#94ff8f" },
      { name: "Team B", selected: false }
    ];

    saveTeamsToStorage(collection, project, teams);

    expect(loadTeamsFromStorage(collection, project)).toEqual(teams);
  });

  it("accepts null backgroundColor", () => {
    localStorage.setItem(key, JSON.stringify([{ name: "Team A", selected: true, backgroundColor: null }]));

    const teams = loadTeamsFromStorage(collection, project);

    expect(teams).toHaveLength(1);
    expect(teams?.[0]?.backgroundColor).toBeNull();
  });

  it("drops one bad entry while keeping valid entries", () => {
    localStorage.setItem(
      key,
      JSON.stringify([
        { name: "Team A", selected: true },
        { name: 42, selected: "yes" },
        { name: "Team C", selected: false }
      ])
    );

    const teams = loadTeamsFromStorage(collection, project);

    expect(teams?.map(t => t.name)).toEqual(["Team A", "Team C"]);
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem(key, "{ not json");

    expect(loadTeamsFromStorage(collection, project)).toBeNull();
  });

  it("returns null when no entries are valid", () => {
    localStorage.setItem(key, JSON.stringify([{ name: "Team A" }, null]));

    expect(loadTeamsFromStorage(collection, project)).toBeNull();
  });

  it("falls back to the legacy storage key", () => {
    localStorage.setItem(`ados-helper-multi-team-${collection}-${project}`, JSON.stringify([{ name: "Legacy Team", selected: true }]));

    const teams = loadTeamsFromStorage(collection, project);

    expect(teams?.[0]?.name).toBe("Legacy Team");
  });
});
