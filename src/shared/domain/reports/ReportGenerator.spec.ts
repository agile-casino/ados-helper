import { describe, expect, it, vi } from "vitest";
import type { WorkItemDto } from "../../api/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generateMultiTeamReport, generateReport, type TeamWorkItems } from "./ReportGenerator";

function createWorkItem(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    type: string;
    tags: string;
    effort: number;
    owner: string;
    children: WorkItemDto[];
    activatedDate: string;
  }> = {}
): WorkItem {
  const dto: WorkItemDto = {
    Microsoft: {
      VSTS: {
        Common: overrides.activatedDate ? { ActivatedDate: overrides.activatedDate } : undefined,
        Scheduling: {
          Effort: overrides.effort ?? 3,
          RemainingWork: 0,
          OriginalEstimate: 5,
          CompletedWork: 5
        }
      }
    },
    System: {
      Id: overrides.id ?? 1,
      WorkItemType: overrides.type ?? "Product Backlog Item",
      TeamProject: "TestProject",
      Rev: 1,
      Tags: overrides.tags ?? "",
      State: overrides.state ?? "New",
      AssignedTo: overrides.owner ?? "John Doe <john.doe@example.com>",
      Title: overrides.title ?? "Test Work Item",
      IterationPath: "TestProject\\Sprint 1",
      HyperLinkCount: 0
    },
    children: overrides.children ?? [],
    links: []
  };
  return new WorkItem(dto);
}

describe("ReportGenerator", () => {
  it("should generate a single-team report and call saveFile", async () => {
    const saveFileMock = vi.fn().mockResolvedValue(undefined);

    const workItems = [
      createWorkItem({ id: 101, state: "Done", title: "Completed PBI" }),
      createWorkItem({ id: 102, state: "In Progress", title: "In Progress PBI" }),
      createWorkItem({ id: 103, state: "New", title: "Not Started PBI" }),
      createWorkItem({ id: 104, state: "Removed", title: "Removed PBI" })
    ];

    await generateReport(saveFileMock, "https://dev.azure.com", "mycoll", "myproj", "MyTeam", "Sprint 1", workItems, new Date("2026-07-01"));

    expect(saveFileMock).toHaveBeenCalledTimes(1);
    const calls = saveFileMock.mock.calls;
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    const [data, filename, mimeType] = firstCall ?? [];
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBeGreaterThan(0);
    expect(filename).toBe("MyTeam - Sprint 1.xlsx");
    expect(mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });

  it("should generate report correctly when there are no work items", async () => {
    const saveFileMock = vi.fn().mockResolvedValue(undefined);

    await generateReport(saveFileMock, "https://dev.azure.com", "mycoll", "myproj", "MyTeam", "Sprint 1", [], new Date("2026-07-01"));

    expect(saveFileMock).toHaveBeenCalledTimes(1);
    expect(saveFileMock.mock.calls[0]?.[1]).toBe("MyTeam - Sprint 1.xlsx");
  });

  it("should generate report with extra cell styling for pulled-in and done tasks", async () => {
    const saveFileMock = vi.fn().mockResolvedValue(undefined);

    // Tag-based styling: Sprint suffix +
    const workItems = [
      createWorkItem({ id: 101, state: "Done", tags: "Sprint 1+" }),
      createWorkItem({ id: 102, state: "Done", tags: "Sprint 1!" }),
      createWorkItem({ id: 103, state: "Done", tags: "Sprint 0" }) // previous sprint
    ];

    await generateReport(saveFileMock, "https://dev.azure.com", "mycoll", "myproj", "MyTeam", "Sprint 1", workItems, new Date("2026-07-01"));

    expect(saveFileMock).toHaveBeenCalledTimes(1);
  });

  it("should generate a multi-team report and call saveFile", async () => {
    const saveFileMock = vi.fn().mockResolvedValue(undefined);

    const teamWorkItems: TeamWorkItems[] = [
      {
        team: "Team A",
        workItems: [createWorkItem({ id: 201, state: "Done", effort: 5 })],
        backgroundColor: "FF0000",
        sprintStartDate: new Date("2026-07-01")
      },
      {
        team: "Team B",
        workItems: [createWorkItem({ id: 202, state: "New", effort: 8 })],
        backgroundColor: "00FF00",
        sprintStartDate: new Date("2026-07-01")
      }
    ];

    await generateMultiTeamReport(saveFileMock, "https://dev.azure.com", "mycoll", "myproj", "Sprint 1", teamWorkItems);

    expect(saveFileMock).toHaveBeenCalledTimes(1);
    const calls = saveFileMock.mock.calls;
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    const [data, filename, mimeType] = firstCall ?? [];
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBeGreaterThan(0);
    expect(filename).toBe("Multi-Team (Team A, Team B) - Sprint 1.xlsx");
    expect(mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});
