import { describe, expect, it } from "vitest";
import type { WorkItemDto } from "../api/WorkItemDto";
import { WorkItem } from "./WorkItem";
import { WorkItemCollection } from "./WorkItemCollection";

describe("WorkItemCollection - Commitment Tracking", () => {
  const createMockWorkItem = (id: number, activatedDate: string, effort: number, state: string): WorkItem => {
    const dto: WorkItemDto = {
      System: {
        Id: id,
        WorkItemType: "Product Backlog Item",
        TeamProject: "TestProject",
        Rev: 1,
        Tags: "",
        State: state,
        AssignedTo: "Test User",
        Title: `Test Item ${id}`,
        IterationPath: "TestProject\\Team\\Sprint 1",
        HyperLinkCount: 0
      },
      Microsoft: {
        VSTS: {
          Common: {
            ActivatedDate: activatedDate
          },
          Scheduling: {
            Effort: effort,
            RemainingWork: 0,
            OriginalEstimate: undefined,
            CompletedWork: undefined
          }
        }
      },
      children: [],
      links: []
    };
    return new WorkItem(dto);
  };

  it("should calculate committed vs pulled-in items based on ActivatedDate", () => {
    const sprintStart = new Date("2026-01-13T00:00:00Z");

    // Items activated on day 1 (committed)
    const item1 = createMockWorkItem(1, "2026-01-13T08:00:00Z", 5, "Done");
    const item2 = createMockWorkItem(2, "2026-01-13T09:00:00Z", 3, "In Progress");

    // Item activated on day 2 (still committed - within 2 day threshold)
    const item3 = createMockWorkItem(3, "2026-01-14T10:00:00Z", 8, "Done");

    // Item activated on day 4 (pulled in late - after 2 day threshold)
    const item4 = createMockWorkItem(4, "2026-01-16T10:00:00Z", 5, "Done");

    const collection = new WorkItemCollection([item1, item2, item3, item4], sprintStart);

    const committedItems = collection.committedWorkItems();
    const pulledInItems = collection.pulledInWorkItems();

    expect(committedItems.length).toBe(3); // items 1, 2, 3
    expect(pulledInItems.length).toBe(1); // item 4
    expect(collection.committedEffort).toBe(16); // 5 + 3 + 8
    expect(collection.completedCommittedEffort).toBe(13); // 5 + 8 (only committed done items)
    expect(collection.completedEffort).toBe(18); // 5 + 8 + 5 (all done items including pulled-in)
    expect(collection.pulledInEffort).toBe(5);
    expect(collection.commitmentPercentage).toBe(113); // 18/16 = 112.5% rounded to 113 (>100% because of pulled-in item)
  });

  it("should handle items without activation dates", () => {
    const dto: WorkItemDto = {
      System: {
        Id: 1,
        WorkItemType: "Product Backlog Item",
        TeamProject: "TestProject",
        Rev: 1,
        Tags: "",
        State: "Done",
        AssignedTo: "Test User",
        Title: "Test Item",
        IterationPath: "TestProject\\Team\\Sprint 1",
        HyperLinkCount: 0
      },
      Microsoft: {
        VSTS: {
          Common: undefined,
          Scheduling: {
            Effort: 5,
            RemainingWork: 0,
            OriginalEstimate: undefined,
            CompletedWork: undefined
          }
        }
      },
      children: [],
      links: []
    };
    const item = new WorkItem(dto);
    const sprintStart = new Date("2026-01-13T00:00:00Z");

    expect(item.isPulledInLate(sprintStart)).toBe(false);
  });
});
