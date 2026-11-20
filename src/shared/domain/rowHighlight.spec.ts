import { describe, expect, it } from "vitest";
import type { WorkItemDto } from "../api/WorkItemDto";
import { getRowHighlight, ROW_HIGHLIGHT_STYLES } from "./rowHighlight";
import { WorkItem } from "./WorkItem";

// Work item in Sprint 13, with the given tags and activation date.
const item = (tags: string, activated: string | null = null): WorkItem => {
  const dto = {
    System: {
      Id: 1,
      WorkItemType: "Product Backlog Item",
      TeamProject: "Proj",
      Rev: 1,
      Tags: tags,
      State: "New",
      AssignedTo: null,
      Title: "Item",
      IterationPath: "Proj\\Team\\Sprint 13",
      HyperLinkCount: 0
    },
    Microsoft: {
      VSTS: {
        Common: { ActivatedDate: activated },
        Scheduling: { Effort: 1, RemainingWork: 0, OriginalEstimate: undefined, CompletedWork: undefined }
      }
    },
    children: [],
    links: []
  } as unknown as WorkItemDto;
  return new WorkItem(dto);
};

const sprintStart = new Date("2026-06-01T00:00:00Z");

describe("getRowHighlight", () => {
  it("highlights a '+' tag in the current sprint as pulled in", () => {
    expect(getRowHighlight(item("Sprint 13+"), sprintStart)).toBe("pulledIn");
  });

  it("highlights a '!' tag in the current sprint as a hotfix", () => {
    expect(getRowHighlight(item("Sprint 13!"), sprintStart)).toBe("hotfix");
  });

  it("highlights an unsuffixed tag from the previous sprint as carried over", () => {
    expect(getRowHighlight(item("Sprint 12"), sprintStart)).toBe("carriedOver");
  });

  it("does not treat a previous sprint '+' tag as carried over", () => {
    expect(getRowHighlight(item("Sprint 12+"), sprintStart)).toBeNull();
  });

  it("uses the activation date when no tag applies", () => {
    const threeDaysLate = "2026-06-04T09:00:00Z";
    const threeDaysEarly = "2026-05-28T09:00:00Z";
    expect(getRowHighlight(item("", threeDaysLate), sprintStart)).toBe("pulledIn");
    expect(getRowHighlight(item("", threeDaysEarly), sprintStart)).toBe("carriedOver");
  });

  it("prefers a tag over the activation date", () => {
    const threeDaysLate = "2026-06-04T09:00:00Z";
    expect(getRowHighlight(item("Sprint 13!", threeDaysLate), sprintStart)).toBe("hotfix");
  });

  it("returns null for an ordinary item", () => {
    expect(getRowHighlight(item("", "2026-06-01T09:00:00Z"), sprintStart)).toBeNull();
  });

  it("gives every category a distinct light colour for the key and reports", () => {
    const colours = Object.values(ROW_HIGHLIGHT_STYLES).map(s => s.color);
    expect(new Set(colours).size).toBe(colours.length);
  });
});
