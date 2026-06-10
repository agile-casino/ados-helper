import { describe, expect, test } from "vitest";
import type { WorkItemDto } from "../api/query/WorkItemDto";
import { WorkItem } from "./WorkItem";

function createWorkItemDto(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    children: WorkItemDto[];
  }> = {}
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
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
  return {
    Microsoft: {
      VSTS: {
        Scheduling: {
          Effort: 0,
          RemainingWork: remainingWork,
          OriginalEstimate: originalEstimate,
          CompletedWork: completedWork
        }
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
});
