import { describe, expect, test } from "vitest";
import type { WorkItemDto } from "../api/WorkItemDto";
import { WorkItem } from "./WorkItem";
import { WorkItemCollection } from "./WorkItemCollection";

function createWorkItemDto(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    tags: string;
    assignedTo: string | null;
    children: WorkItemDto[];
    effort: number;
  }> = {}
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
        Common: undefined,
        Scheduling: {
          Effort: overrides.effort !== undefined ? overrides.effort : 3,
          RemainingWork: 0,
          OriginalEstimate: undefined,
          CompletedWork: undefined
        }
      }
    },
    System: {
      Id: overrides.id ?? 1,
      WorkItemType: "User Story",
      TeamProject: "TestProject",
      Rev: 1,
      Tags: overrides.tags ?? "",
      State: overrides.state ?? "New",
      AssignedTo: overrides.assignedTo ?? null,
      Title: overrides.title ?? "Test Work Item",
      IterationPath: "TestProject\\Sprint 1",
      HyperLinkCount: 0
    },
    children: overrides.children ?? [],
    links: []
  };
}

describe("WorkItemCollection", () => {
  describe("getWorkItemCategory", () => {
    test("returns 'Study Time' for work item with [Study Time] prefix in title", () => {
      const dto = createWorkItemDto({ title: "[Study Time] Learn TypeScript" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Study Time");
    });

    test("returns 'Done' for work item with Done state", () => {
      const dto = createWorkItemDto({ state: "Done" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Done");
    });

    test("returns 'Done' for work item with Staging state", () => {
      const dto = createWorkItemDto({ state: "Staging" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Done");
    });

    test("returns 'Done' for work item with Released state", () => {
      const dto = createWorkItemDto({ state: "Released" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Done");
    });

    test("returns 'Removed' for work item with sprint tag ending in minus", () => {
      const dto = createWorkItemDto({ tags: "Sprint 23-" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Removed");
    });

    test("returns 'In Progress' for work item with task that has started", () => {
      const taskDto = createWorkItemDto({ state: "In Progress" });
      const dto = createWorkItemDto({
        state: "Active",
        children: [taskDto]
      });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("In Progress");
    });

    test("returns 'Not Started' for new work item with no progress", () => {
      const dto = createWorkItemDto({ state: "New" });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Not Started");
    });

    test("Study Time takes precedence over Done state", () => {
      const dto = createWorkItemDto({
        title: "[Study Time] Completed study",
        state: "Done"
      });
      const workItem = new WorkItem(dto);
      const collection = new WorkItemCollection([workItem]);

      expect(collection.getWorkItemCategory(workItem)).toBe("Study Time");
    });
  });

  describe("done", () => {
    test("returns work items with Done state", () => {
      const doneDto = createWorkItemDto({ id: 1, state: "Done", title: "Done Item" });
      const newDto = createWorkItemDto({ id: 2, state: "New", title: "New Item" });
      const doneWorkItem = new WorkItem(doneDto);
      const newWorkItem = new WorkItem(newDto);
      const collection = new WorkItemCollection([doneWorkItem, newWorkItem]);

      expect(collection.done).toHaveLength(1);
      expect(collection.done[0]?.title).toBe("Done Item");
    });

    test("returns work items with Staging state", () => {
      const dto = createWorkItemDto({ id: 1, state: "Staging", title: "Staging Item" });
      const collection = new WorkItemCollection([new WorkItem(dto)]);

      expect(collection.done).toHaveLength(1);
      expect(collection.done[0]?.title).toBe("Staging Item");
    });

    test("returns work items with Released state", () => {
      const dto = createWorkItemDto({ id: 1, state: "Released", title: "Released Item" });
      const collection = new WorkItemCollection([new WorkItem(dto)]);

      expect(collection.done).toHaveLength(1);
      expect(collection.done[0]?.title).toBe("Released Item");
    });

    test("sorts done items by title", () => {
      const dto1 = createWorkItemDto({ id: 1, state: "Done", title: "Zebra" });
      const dto2 = createWorkItemDto({ id: 2, state: "Done", title: "Alpha" });
      const collection = new WorkItemCollection([new WorkItem(dto1), new WorkItem(dto2)]);

      expect(collection.done[0]?.title).toBe("Alpha");
      expect(collection.done[1]?.title).toBe("Zebra");
    });
  });

  describe("inProgress", () => {
    test("returns work items that are in progress", () => {
      const taskDto = createWorkItemDto({ state: "In Progress" });
      const inProgressDto = createWorkItemDto({
        id: 1,
        state: "Active",
        title: "In Progress Item",
        children: [taskDto]
      });
      const newDto = createWorkItemDto({ id: 2, state: "New", title: "New Item" });
      const collection = new WorkItemCollection([new WorkItem(inProgressDto), new WorkItem(newDto)]);

      expect(collection.inProgress).toHaveLength(1);
      expect(collection.inProgress[0]?.title).toBe("In Progress Item");
    });
  });

  describe("notStarted", () => {
    test("returns work items that have not started", () => {
      const doneDto = createWorkItemDto({ id: 1, state: "Done", title: "Done Item" });
      const newDto = createWorkItemDto({ id: 2, state: "New", title: "New Item" });
      const collection = new WorkItemCollection([new WorkItem(doneDto), new WorkItem(newDto)]);

      expect(collection.notStarted).toHaveLength(1);
      expect(collection.notStarted[0]?.title).toBe("New Item");
    });
  });

  describe("removed", () => {
    test("returns work items that have been removed (sprint tag with minus)", () => {
      const removedDto = createWorkItemDto({ id: 1, title: "Removed Item", tags: "Sprint 23-" });
      const normalDto = createWorkItemDto({ id: 2, title: "Normal Item", tags: "Sprint 23" });
      const collection = new WorkItemCollection([new WorkItem(removedDto), new WorkItem(normalDto)]);

      expect(collection.removed).toHaveLength(1);
      expect(collection.removed[0]?.title).toBe("Removed Item");
    });
  });

  describe("studyTime", () => {
    test("returns work items with [Study Time] prefix", () => {
      const studyDto = createWorkItemDto({ id: 1, title: "[Study Time] Learn React" });
      const normalDto = createWorkItemDto({ id: 2, title: "Normal Item" });
      const collection = new WorkItemCollection([new WorkItem(studyDto), new WorkItem(normalDto)]);

      expect(collection.studyTime).toHaveLength(1);
      expect(collection.studyTime[0]?.title).toBe("[Study Time] Learn React");
    });
  });

  describe("sprint metrics and commitment calculations", () => {
    test("estimatedSprintStartDate calculates correctly", () => {
      // No activated dates
      const collection1 = new WorkItemCollection([new WorkItem(createWorkItemDto({ id: 1 })), new WorkItem(createWorkItemDto({ id: 2 }))]);
      expect(collection1.estimatedSprintStartDate).toBeUndefined();

      // One activated date
      const w1 = createWorkItemDto({ id: 1 });
      w1.Microsoft = {
        VSTS: {
          Common: { ActivatedDate: "2026-06-17T08:00:00Z" },
          Scheduling: { Effort: 3, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
        }
      };
      const collection2 = new WorkItemCollection([new WorkItem(w1)]);
      expect(collection2.estimatedSprintStartDate?.toISOString()).toBe("2026-06-17T08:00:00.000Z");

      // Multiple activated dates (returns 25th percentile)
      const w2 = createWorkItemDto({ id: 2 });
      w2.Microsoft = {
        VSTS: {
          Common: { ActivatedDate: "2026-06-18T08:00:00Z" },
          Scheduling: { Effort: 3, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
        }
      };
      const w3 = createWorkItemDto({ id: 3 });
      w3.Microsoft = {
        VSTS: {
          Common: { ActivatedDate: "2026-06-19T08:00:00Z" },
          Scheduling: { Effort: 3, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
        }
      };
      const w4 = createWorkItemDto({ id: 4 });
      w4.Microsoft = {
        VSTS: {
          Common: { ActivatedDate: "2026-06-20T08:00:00Z" },
          Scheduling: { Effort: 3, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
        }
      };

      const collection3 = new WorkItemCollection([new WorkItem(w1), new WorkItem(w2), new WorkItem(w3), new WorkItem(w4)]);
      expect(collection3.estimatedSprintStartDate?.toISOString()).toBe("2026-06-18T08:00:00.000Z");
    });

    test("handles undefined sprint start date in committed/pulledIn items", () => {
      const item = new WorkItem(createWorkItemDto({ id: 1, title: "Item 1" }));
      const collection = new WorkItemCollection([item]);

      expect(collection.committedWorkItems()).toHaveLength(1);
      expect(collection.pulledInWorkItems()).toHaveLength(0);
    });

    test("commitmentPercentage returns 0 if committedEffort is 0", () => {
      const item = new WorkItem(createWorkItemDto({ id: 1, effort: 0 }));
      const collection = new WorkItemCollection([item]);
      expect(collection.committedEffort).toBe(0);
      expect(collection.commitmentPercentage).toBe(0);
    });

    test("calculates completedCommittedEffort and pulledInEffort", () => {
      const sprintStart = new Date("2026-06-17T00:00:00Z");
      // Committed & Done (effort 5)
      const w1 = createWorkItemDto({ id: 1, state: "Done", effort: 5 });
      w1.Microsoft.VSTS.Common = { ActivatedDate: "2026-06-17T08:00:00Z" };

      // Pulled in late (activated on day 4) & Done (effort 8)
      const w2 = createWorkItemDto({ id: 2, state: "Done", effort: 8 });
      w2.Microsoft.VSTS.Common = { ActivatedDate: "2026-06-21T08:00:00Z" };

      const collection = new WorkItemCollection([new WorkItem(w1), new WorkItem(w2)], sprintStart);
      expect(collection.completedCommittedEffort).toBe(5);
      expect(collection.pulledInEffort).toBe(8);
    });
  });
});
