import { describe, expect, it } from "vitest";
import type { WorkItemDto } from "../api/WorkItemDto";
import { WorkItem } from "./WorkItem";
import { WorkItemCollection } from "./WorkItemCollection";

const item = (id: number, effort: number, state: string): WorkItem => {
  const dto = {
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

describe("WorkItemCollection completed percentage", () => {
  it("is the share of sprint points that are Done, including added items", () => {
    const collection = new WorkItemCollection([item(1, 5, "Done"), item(2, 3, "In Progress"), item(3, 2, "Done")]);
    expect(collection.activeEffort).toBe(10);
    expect(collection.completedPercentage).toBe(70);
  });

  it("excludes removed items from the total", () => {
    const collection = new WorkItemCollection([item(1, 4, "Done"), item(2, 4, "In Progress"), item(3, 8, "Removed")]);
    expect(collection.activeEffort).toBe(8);
    expect(collection.completedPercentage).toBe(50);
  });

  it("returns null when the sprint has no points", () => {
    const collection = new WorkItemCollection([item(1, 0, "Done")]);
    expect(collection.completedPercentage).toBeNull();
  });
});
