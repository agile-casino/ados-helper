import { describe, expect, it } from "vitest";
import type { AzureDevOpsIteration } from "../api/schemas";
import type { WorkItemDto } from "../api/WorkItemDto";
import { calculateSayDo, getCommitSnapshotDate, getFinalSnapshotDate, normalizeIterationPath, selectTrendSprints } from "./sayDo";
import { WorkItem } from "./WorkItem";

const item = (id: number, effort: number, state: string): WorkItem => {
  const dto: WorkItemDto = {
    System: {
      Id: id,
      WorkItemType: "Product Backlog Item",
      TeamProject: "Proj",
      Rev: 1,
      Tags: "",
      State: state,
      AssignedTo: null,
      Title: `Item ${id}`,
      IterationPath: "Proj\\Team\\Sprint 1",
      HyperLinkCount: 0
    },
    Microsoft: {
      VSTS: {
        Common: { ActivatedDate: null },
        Scheduling: { Effort: effort, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
      }
    },
    children: [],
    links: []
  } as unknown as WorkItemDto;
  return new WorkItem(dto);
};

describe("snapshot dates", () => {
  it("commit snapshot is the end of Day 2 (start + 1 day)", () => {
    const start = new Date("2026-01-13T00:00:00Z");
    expect(getCommitSnapshotDate(start).toISOString()).toBe("2026-01-14T23:59:59.999Z");
  });

  it("final snapshot is the end of the day before finish for a past sprint", () => {
    const finish = new Date("2026-01-27T00:00:00Z");
    const now = new Date("2026-06-01T00:00:00Z");
    expect(getFinalSnapshotDate(finish, now).toISOString()).toBe("2026-01-26T23:59:59.999Z");
  });

  it("final snapshot is now for a sprint still in progress", () => {
    const finish = new Date("2026-01-27T00:00:00Z");
    const now = new Date("2026-01-20T10:00:00Z");
    expect(getFinalSnapshotDate(finish, now).toISOString()).toBe("2026-01-20T10:00:00.000Z");
  });
});

describe("calculateSayDo", () => {
  it("counts completed committed points over committed points", () => {
    const initial = [item(1, 5, "New"), item(2, 3, "New"), item(3, 2, "New")];
    const final = [item(1, 5, "Done"), item(2, 3, "Active"), item(3, 2, "Done")];
    expect(calculateSayDo(initial, final)).toMatchObject({ committedPoints: 10, completedCommittedPoints: 7, completedCommittedCount: 2, percent: 70 });
  });

  it("ignores items added after the commitment snapshot", () => {
    const initial = [item(1, 5, "New")];
    const final = [item(1, 5, "Active"), item(9, 8, "Done")];
    expect(calculateSayDo(initial, final)).toMatchObject({ committedPoints: 5, completedCommittedPoints: 0, percent: 0 });
  });

  it("keeps items removed mid-sprint in the committed total but cannot complete them", () => {
    const initial = [item(1, 5, "New"), item(2, 5, "New")];
    const final = [item(1, 5, "Done"), item(2, 5, "Removed")];
    expect(calculateSayDo(initial, final).percent).toBe(50);
  });

  it("returns null when nothing was committed", () => {
    expect(calculateSayDo([], [item(1, 3, "Done")]).percent).toBeNull();
  });

  it("rounds to the nearest whole percent", () => {
    const initial = [item(1, 3, "New"), item(2, 3, "New"), item(3, 3, "New")];
    const final = [item(1, 3, "Done"), item(2, 3, "Done"), item(3, 3, "Active")];
    expect(calculateSayDo(initial, final).percent).toBe(67);
  });

  it("does not exceed 100% when every committed item is done", () => {
    const initial = [item(1, 2, "New")];
    const final = [item(1, 2, "Done"), item(7, 4, "Done")];
    expect(calculateSayDo(initial, final).percent).toBe(100);
  });
});

describe("normalizeIterationPath", () => {
  it("strips the project prefix case-insensitively and normalises slashes", () => {
    expect(normalizeIterationPath("Proj/Team/Sprint 1", "proj")).toBe("Team\\Sprint 1");
    expect(normalizeIterationPath("Team\\Sprint 1", "Proj")).toBe("Team\\Sprint 1");
  });
});

describe("selectTrendSprints", () => {
  const sprint = (n: number, start: string): AzureDevOpsIteration => ({
    name: `Sprint ${n}`,
    path: `Proj\\Team\\Sprint ${n}`,
    attributes: { startDate: start, finishDate: new Date(new Date(start).getTime() + 14 * 86400000).toISOString() }
  });
  const iterations = [
    sprint(1, "2026-01-01T00:00:00Z"),
    sprint(2, "2026-01-15T00:00:00Z"),
    sprint(3, "2026-01-29T00:00:00Z"),
    sprint(4, "2026-02-12T00:00:00Z"),
    sprint(5, "2026-02-26T00:00:00Z"),
    sprint(6, "2026-03-12T00:00:00Z"),
    sprint(7, "2026-03-26T00:00:00Z")
  ];
  const now = new Date("2026-03-30T00:00:00Z");

  it("returns the selected sprint and the four before it, oldest first", () => {
    const result = selectTrendSprints(iterations, { name: "Sprint 6", path: "Team\\Sprint 6" }, "Proj", 5, now);
    expect(result.map(s => s.name)).toEqual(["Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6"]);
    expect(result[0]?.path).toBe("Team\\Sprint 2");
  });

  it("returns fewer when there are not enough earlier sprints", () => {
    const result = selectTrendSprints(iterations, { name: "Sprint 2", path: "Team\\Sprint 2" }, "Proj", 5, now);
    expect(result.map(s => s.name)).toEqual(["Sprint 1", "Sprint 2"]);
  });

  it("does not chart a selected sprint that has not started yet", () => {
    const beforeSprint6 = new Date("2026-03-01T00:00:00Z");
    expect(selectTrendSprints(iterations, { name: "Sprint 6", path: "Team\\Sprint 6" }, "Proj", 5, beforeSprint6)).toEqual([]);
  });

  it("includes sprints that started before now, up to the selected one", () => {
    const beforeSprint6 = new Date("2026-03-01T00:00:00Z");
    const result = selectTrendSprints(iterations, { name: "Sprint 5", path: "Team\\Sprint 5" }, "Proj", 5, beforeSprint6);
    expect(result.map(s => s.name)).toEqual(["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5"]);
  });

  it("skips sprints without dates", () => {
    const withoutDates = [...iterations.slice(0, 2), { name: "Sprint 3", path: "Proj\\Team\\Sprint 3", attributes: null }];
    const result = selectTrendSprints(withoutDates, { name: "Sprint 2", path: "Team\\Sprint 2" }, "Proj", 5, now);
    expect(result.map(s => s.name)).toEqual(["Sprint 1", "Sprint 2"]);
  });

  it("returns nothing when the selected sprint is not found", () => {
    expect(selectTrendSprints(iterations, { name: "Nope", path: "Team\\Nope" }, "Proj", 5, now)).toEqual([]);
  });
});
