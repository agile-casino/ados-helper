import { describe, expect, test, vi } from "vitest";
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

  describe("additional properties and edge cases", () => {
    test("assignedTo returns System.AssignedTo", () => {
      const dto = createWorkItemDto();
      dto.System.AssignedTo = "John Doe";
      const workItem = new WorkItem(dto);
      expect(workItem.assignedTo).toBe("John Doe");
    });

    test("effort returns Effort scheduled", () => {
      const dto = createWorkItemDto();
      const workItem = new WorkItem(dto);
      expect(workItem.effort).toBe(3);
    });

    test("title returns System.Title", () => {
      const dto = createWorkItemDto({ title: "Custom Title" });
      const workItem = new WorkItem(dto);
      expect(workItem.title).toBe("Custom Title");
    });

    test("allTasksDone returns correct boolean", () => {
      // Empty children
      expect(new WorkItem(createWorkItemDto({ children: [] })).allTasksDone).toBe(false);

      // All Done/Removed
      const tasks1: [WorkItemDto, WorkItemDto] = [createTaskDto(), createTaskDto()];
      tasks1[0].System.State = "Done";
      tasks1[1].System.State = "Removed";
      expect(new WorkItem(createWorkItemDto({ children: tasks1 })).allTasksDone).toBe(true);

      // Some To Do
      const tasks2: [WorkItemDto, WorkItemDto] = [createTaskDto(), createTaskDto()];
      tasks2[0].System.State = "Done";
      tasks2[1].System.State = "To Do";
      expect(new WorkItem(createWorkItemDto({ children: tasks2 })).allTasksDone).toBe(false);
    });

    test("isDone returns true for Done, Staging, Released states", () => {
      expect(new WorkItem(createWorkItemDto({ state: "Done" })).isDone).toBe(true);
      expect(new WorkItem(createWorkItemDto({ state: "Staging" })).isDone).toBe(true);
      expect(new WorkItem(createWorkItemDto({ state: "Released" })).isDone).toBe(true);
      expect(new WorkItem(createWorkItemDto({ state: "New" })).isDone).toBe(false);
    });

    test("isInProgress returns correct boolean", () => {
      // If done, should be false
      const doneItem = new WorkItem(createWorkItemDto({ state: "Done" }));
      expect(doneItem.isInProgress).toBe(false);

      // If not done, and all tasks are To Do, should be false
      const todoItem = new WorkItem(
        createWorkItemDto({
          state: "New",
          children: [createTaskDto()]
        })
      );
      expect(todoItem.isInProgress).toBe(false);

      // If not done, and some task is In Progress
      const tasks: [WorkItemDto] = [createTaskDto()];
      tasks[0].System.State = "In Progress";
      const inProgressItem = new WorkItem(
        createWorkItemDto({
          state: "New",
          children: tasks
        })
      );
      expect(inProgressItem.isInProgress).toBe(true);
    });

    test("isRemoved returns true if sprintTag suffix is '-'", () => {
      const dto = createWorkItemDto();
      dto.System.Tags = "Sprint 23-";
      const workItem = new WorkItem(dto);
      expect(workItem.isRemoved).toBe(true);

      dto.System.Tags = "Sprint 23+";
      const workItem2 = new WorkItem(dto);
      expect(workItem2.isRemoved).toBe(false);
    });

    test("sprint returns Tag representing the iteration path tail", () => {
      const dto = createWorkItemDto();
      dto.System.IterationPath = "Project\\Area\\Sprint 42";
      const workItem = new WorkItem(dto);
      expect(workItem.sprint?.text).toBe("Sprint 42");

      dto.System.IterationPath = "";
      const workItem2 = new WorkItem(dto);
      expect(workItem2.sprint).toBeUndefined();
    });

    test("sprintTag returns first sprint tag and logs warning if multiple exist", () => {
      const dto = createWorkItemDto();
      dto.System.Tags = "Sprint 23; Sprint 24; Tag3";
      const workItem = new WorkItem(dto);

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      expect(workItem.sprintTag?.text).toBe("Sprint 23");
      expect(logSpy).toHaveBeenCalledWith("Work Item 1 has 2 sprint tags.");
      logSpy.mockRestore();

      // No sprint tags
      dto.System.Tags = "Tag1; Tag2";
      const workItem2 = new WorkItem(dto);
      expect(workItem2.sprintTag).toBeUndefined();
    });

    test("state returns System.State", () => {
      const dto = createWorkItemDto({ state: "Approved" });
      const workItem = new WorkItem(dto);
      expect(workItem.state).toBe("Approved");
    });

    test("tags parses semicolon separated tags", () => {
      const dto = createWorkItemDto();
      dto.System.Tags = "Tag1; Tag2; Tag3";
      const workItem = new WorkItem(dto);
      expect(workItem.tags.map(t => t.text)).toEqual(["Tag1", "Tag2", "Tag3"]);

      dto.System.Tags = "";
      const workItem2 = new WorkItem(dto);
      expect(workItem2.tags).toEqual([]);
    });

    test("owner returns AssignedTo or fallback to tasks most frequent assignee", () => {
      // AssignedTo is set
      const dto = createWorkItemDto();
      dto.System.AssignedTo = "Alice";
      const workItem = new WorkItem(dto);
      expect(workItem.owner).toBe("Alice");

      // AssignedTo is null, fallback to tasks
      const dto2 = createWorkItemDto();
      dto2.System.AssignedTo = null;
      const task1 = createTaskDto();
      task1.System.AssignedTo = "Bob";
      const task2 = createTaskDto();
      task2.System.AssignedTo = "Bob";
      const task3 = createTaskDto();
      task3.System.AssignedTo = "Charlie";
      dto2.children = [task1, task2, task3];

      const workItem2 = new WorkItem(dto2);
      expect(workItem2.owner).toBe("Bob");

      // No assignees anywhere
      const dto3 = createWorkItemDto();
      dto3.System.AssignedTo = null;
      dto3.children = [createTaskDto()];
      const workItem3 = new WorkItem(dto3);
      expect(workItem3.owner).toBeNull();
    });

    test("wiseLink and wiseNumber parse correctly", () => {
      const dto = createWorkItemDto();
      dto.links = ["http://wise/12345"];
      const workItem = new WorkItem(dto);
      expect(workItem.wiseLink).toBe("http://wise/12345");
      expect(workItem.wiseNumber).toBe("12345");

      // No wise link
      dto.links = ["http://other/12345"];
      const workItem2 = new WorkItem(dto);
      expect(workItem2.wiseLink).toBeUndefined();
      expect(workItem2.wiseNumber).toBeUndefined();

      // Malformed wise link without numbers at the end
      dto.links = ["http://wise/abc"];
      const workItem3 = new WorkItem(dto);
      expect(workItem3.wiseLink).toBe("http://wise/abc");
      expect(workItem3.wiseNumber).toBeUndefined();
    });
  });
});
