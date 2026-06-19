import { describe, expect, test } from "vitest";
import type { WorkItemDto } from "../api/query/WorkItemDto";
import { WorkItem } from "./WorkItem";

function createWorkItemDto(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    children: WorkItemDto[];
    activatedDate: string;
  }> = {}
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
        ...(overrides.activatedDate ? { Common: { ActivatedDate: overrides.activatedDate } } : {}),
        Scheduling: {
          Effort: 3,
          RemainingWork: 0,
          OriginalEstimate: 0,
          CompletedWork: 0
        }
      }
    },
    System: {
      Id: overrides.id ?? 1,
      WorkItemType: "User Story",
      TeamProject: "TestProject",
      Rev: 1,
      Tags: "",
      State: overrides.state ?? "New",
      AssignedTo: null,
      Title: overrides.title ?? "Test Work Item",
      IterationPath: "TestProject\\Sprint 1",
      HyperLinkCount: 0
    },
    children: overrides.children ?? [],
    links: []
  };
}

function createTaskDto(originalEstimate?: number, completedWork?: number, remainingWork?: number): WorkItemDto {
  const scheduling: {
    Effort: number;
    RemainingWork?: number;
    OriginalEstimate?: number;
    CompletedWork?: number;
  } = { Effort: 0 };
  if (remainingWork !== undefined) {
    scheduling.RemainingWork = remainingWork;
  }
  if (originalEstimate !== undefined) {
    scheduling.OriginalEstimate = originalEstimate;
  }
  if (completedWork !== undefined) {
    scheduling.CompletedWork = completedWork;
  }

  return {
    Microsoft: {
      VSTS: {
        Scheduling: scheduling
      }
    },
    System: {
      Id: 2,
      WorkItemType: "Task",
      TeamProject: "TestProject",
      Rev: 1,
      Tags: "",
      State: "To Do",
      AssignedTo: null,
      Title: "Test Task",
      IterationPath: "TestProject\\Sprint 1",
      HyperLinkCount: 0
    },
    children: [],
    links: []
  };
}

describe("WorkItem", () => {
  test("calculates the sum of original estimates of tasks", () => {
    const tasks = [createTaskDto(5, 2, 3), createTaskDto(3, 1, 2), createTaskDto(undefined, undefined, undefined)];
    const dto = createWorkItemDto({ children: tasks });
    const workItem = new WorkItem(dto);

    expect(workItem.originalEstimate).toBe(8);
  });

  test("calculates the sum of completed work of tasks", () => {
    const tasks = [createTaskDto(5, 2, 3), createTaskDto(3, 1, 2), createTaskDto(undefined, undefined, undefined)];
    const dto = createWorkItemDto({ children: tasks });
    const workItem = new WorkItem(dto);

    expect(workItem.completedWork).toBe(3);
  });

  test("calculates the sum of remaining work of tasks", () => {
    const tasks = [createTaskDto(5, 2, 3), createTaskDto(3, 1, 2), createTaskDto(undefined, undefined, undefined)];
    const dto = createWorkItemDto({ children: tasks });
    const workItem = new WorkItem(dto);

    expect(workItem.remainingWork).toBe(5);
  });

  describe("isPulledInLate", () => {
    test("returns false when there is no activated date", () => {
      const workItem = new WorkItem(createWorkItemDto());
      expect(workItem.isPulledInLate(new Date("2026-06-17T00:00:00Z"))).toBe(false);
    });

    test("returns false when activated <= 2 days after sprint start", () => {
      const sprintStart = new Date("2026-06-17T00:00:00Z");
      // exactly 2 days after
      const workItem = new WorkItem(createWorkItemDto({ activatedDate: "2026-06-19T00:00:00Z" }));
      expect(workItem.isPulledInLate(sprintStart)).toBe(false);
    });

    test("returns true when activated > 2 days after sprint start", () => {
      const sprintStart = new Date("2026-06-17T00:00:00Z");
      // 2 days and 1 second after
      const workItem = new WorkItem(createWorkItemDto({ activatedDate: "2026-06-19T00:00:01Z" }));
      expect(workItem.isPulledInLate(sprintStart)).toBe(true);
    });
  });

  describe("isActivatedEarly", () => {
    test("returns false when there is no activated date", () => {
      const workItem = new WorkItem(createWorkItemDto());
      expect(workItem.isActivatedEarly(new Date("2026-06-17T00:00:00Z"))).toBe(false);
    });

    test("returns false when activated >= 2 days before sprint start", () => {
      const sprintStart = new Date("2026-06-17T00:00:00Z");
      // exactly 2 days before
      const workItem = new WorkItem(createWorkItemDto({ activatedDate: "2026-06-15T00:00:00Z" }));
      expect(workItem.isActivatedEarly(sprintStart)).toBe(false);
    });

    test("returns true when activated > 2 days before sprint start", () => {
      const sprintStart = new Date("2026-06-17T00:00:00Z");
      // more than 2 days before (e.g., 2 days and 1 second before)
      const workItem = new WorkItem(createWorkItemDto({ activatedDate: "2026-06-14T23:59:59Z" }));
      expect(workItem.isActivatedEarly(sprintStart)).toBe(true);
    });
  });
});
