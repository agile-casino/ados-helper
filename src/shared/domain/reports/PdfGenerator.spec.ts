import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkItemDto } from "../../api/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generateAcceptanceCriteriaReport, generateMultiTeamAcceptanceCriteriaReport, generateMultiTeamPdfReport, generatePdfReport } from "./PdfGenerator";

const mockAutoTable = vi.fn().mockImplementation((_doc, options) => {
  if (options?.body && Array.isArray(options.body)) {
    for (const [rowIndex, rowRaw] of options.body.entries()) {
      const mockRow = { raw: rowRaw, index: rowIndex };

      // Call didParseCell for each column
      if (options.didParseCell) {
        for (const col of options.columns || []) {
          const mockCell = { styles: {} };
          options.didParseCell({
            section: "body",
            row: mockRow,
            column: col,
            cell: mockCell
          });
        }
      }

      // Call didDrawCell for each column
      if (options.didDrawCell) {
        for (const col of options.columns || []) {
          const mockCell = { x: 10, y: 10, width: 20, height: 10 };
          options.didDrawCell({
            section: "body",
            row: mockRow,
            column: col,
            cell: mockCell
          });
        }
      }
    }
  }
});

vi.mock("jspdf-autotable", () => ({
  default: (...args: unknown[]) => mockAutoTable(...args)
}));

const mockSave = vi.fn();
const mockSaveFile = vi.fn();
const mockText = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockRect = vi.fn();
const mockLink = vi.fn();
const mockOutput = vi.fn().mockReturnValue(new ArrayBuffer(0));

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(
      class MockJsPDF {
        internal = {
          pageSize: {
            getWidth: () => 297,
            getHeight: () => 210
          }
        };
        save = mockSave;
        text = mockText;
        addPage = mockAddPage;
        setPage = mockSetPage;
        setFont = mockSetFont;
        setFontSize = mockSetFontSize;
        setTextColor = mockSetTextColor;
        setFillColor = mockSetFillColor;
        rect = mockRect;
        link = mockLink;
        output = mockOutput;
        getNumberOfPages = () => 1;
        splitTextToSize = (text: string) => String(text).split("\n");
        lastAutoTable = { finalY: 100 };
      } as unknown as (...args: unknown[]) => unknown
    )
  };
});

function createWorkItemDto(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    tags: string;
    iterationPath: string;
    links: string[];
    activatedDate: string;
    acceptanceCriteria: string;
    workItemType: string;
  }>
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
        Common:
          overrides.activatedDate || overrides.acceptanceCriteria
            ? {
                ActivatedDate: overrides.activatedDate,
                AcceptanceCriteria: overrides.acceptanceCriteria ?? ""
              }
            : undefined,
        Scheduling: {
          Effort: 3,
          RemainingWork: 0,
          OriginalEstimate: undefined,
          CompletedWork: undefined
        }
      }
    },
    System: {
      Id: overrides.id ?? 1,
      WorkItemType: overrides.workItemType ?? "User Story",
      TeamProject: "TestProject",
      Rev: 1,
      Tags: overrides.tags ?? "",
      State: overrides.state ?? "New",
      AssignedTo: null,
      Title: overrides.title ?? "Test Work Item",
      IterationPath: overrides.iterationPath ?? "TestProject\\Sprint 1",
      HyperLinkCount: 0
    },
    children: [],
    links: overrides.links ?? []
  };
}

describe("PdfGenerator", () => {
  beforeEach(() => {
    mockAutoTable.mockClear();
    mockSave.mockClear();
    mockSaveFile.mockClear();
  });

  test("hides WQ/SDR column if no work item has a WQ/SDR", () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, state: "Done", title: "PBI 1" }))];
    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    expect(mockAutoTable).toHaveBeenCalled();
    const calls = mockAutoTable.mock.calls;
    for (const call of calls) {
      const options = call[1] as {
        columns: { dataKey: string }[];
        columnStyles: Record<string, unknown>;
      };
      expect(options.columns).not.toContainEqual(expect.objectContaining({ dataKey: "wise" }));
      expect(options.columnStyles["wise"]).toBeUndefined();
    }
  });

  test("shows WQ/SDR column if at least one work item has a WQ/SDR", () => {
    const workItems = [
      new WorkItem(
        createWorkItemDto({
          id: 1,
          state: "Done",
          title: "PBI 1",
          links: ["https://wise.com/12345"]
        })
      )
    ];
    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    expect(mockAutoTable).toHaveBeenCalled();
    const calls = mockAutoTable.mock.calls;
    for (const call of calls) {
      const options = call[1] as {
        columns: { dataKey: string }[];
        columnStyles: Record<string, unknown>;
      };
      expect(options.columns).toContainEqual(expect.objectContaining({ dataKey: "wise" }));
      expect(options.columnStyles["wise"]).toEqual({ cellWidth: 25, halign: "center" });
    }
  });

  test("sanitizes special unicode symbols (like arrows) in descriptions", () => {
    const workItems = [
      new WorkItem(
        createWorkItemDto({
          id: 1,
          state: "Done",
          title: "PBI with arrow → and curly quotes ‘hello’"
        })
      )
    ];
    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    expect(mockAutoTable).toHaveBeenCalled();
    const calls = mockAutoTable.mock.calls;
    // Find the call for the Done (Completed) section
    const completedCall = calls.find(call => {
      const options = call[1] as { body: { description: string }[] };
      return options.body.some(b => b.description.startsWith("PBI with arrow"));
    });
    expect(completedCall).toBeDefined();
    const body = completedCall?.[1]?.body;
    expect(body?.[0]?.description).toBe("PBI with arrow -> and curly quotes 'hello'");
  });

  test("flags PBIs activated > 2 days before sprint start as pink, and does not flag those activated < 2 days before", () => {
    const sprintStartDate = new Date("2026-06-17T00:00:00Z");
    const workItems = [
      // Activated 1 day before sprint start (< 2 days before) -> should NOT be pink (bgColor should be null)
      new WorkItem(
        createWorkItemDto({
          id: 101,
          state: "Done",
          title: "PBI Activated 1 day before",
          activatedDate: "2026-06-16T00:00:00Z"
        })
      ),
      // Activated 3 days before sprint start (> 2 days before) -> should be pink (#f2dcdb)
      new WorkItem(
        createWorkItemDto({
          id: 102,
          state: "Done",
          title: "PBI Activated 3 days before",
          activatedDate: "2026-06-14T00:00:00Z"
        })
      )
    ];

    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems, sprintStartDate);

    expect(mockAutoTable).toHaveBeenCalled();
    const calls = mockAutoTable.mock.calls;

    // Find the call for the Done (Completed) section
    const completedCall = calls.find(call => {
      const options = call[1] as { body: { description: string }[] };
      return options.body.some(b => b.description.includes("PBI Activated"));
    });

    expect(completedCall).toBeDefined();
    const body = completedCall?.[1]?.body as { id: string; meta: { bgColor: string | null } }[];

    const pbi101 = body.find(b => b.id === "101");
    const pbi102 = body.find(b => b.id === "102");

    expect(pbi101).toBeDefined();
    expect(pbi102).toBeDefined();

    // PBI 101 is not early activated (< 2 days before start) -> no background color
    expect(pbi101?.meta.bgColor).toBeNull();

    // PBI 102 is early activated (> 2 days before start) -> pink background color
    expect(pbi102?.meta.bgColor).toBe("#f2dcdb");
  });

  test("applies tag-based color coding for sprint suffixes and carry overs", () => {
    // Sprint suffix + -> #eeece1
    const w1 = new WorkItem(createWorkItemDto({ id: 1, state: "Done", title: "PBI 1", tags: "Sprint 1+", iterationPath: "Project\\Sprint 1" }));

    // Sprint suffix ! -> #FFCC66
    const w2 = new WorkItem(createWorkItemDto({ id: 2, state: "Done", title: "PBI 2", tags: "Sprint 1!", iterationPath: "Project\\Sprint 1" }));

    // Previous sprint (carry over) -> #f2dcdb
    const w3 = new WorkItem(createWorkItemDto({ id: 3, state: "Done", title: "PBI 3", tags: "Sprint 1", iterationPath: "Project\\Sprint 2" }));

    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", [w1, w2, w3]);

    expect(mockAutoTable).toHaveBeenCalled();
    const calls = mockAutoTable.mock.calls;
    const completedCall = calls.find(call => {
      const options = call[1] as { body: { id: string }[] };
      return options.body.some(b => b.id === "1");
    });
    const body = completedCall?.[1]?.body as { id: string; meta: { bgColor: string | null } }[];

    expect(body.find(b => b.id === "1")?.meta.bgColor).toBe("#eeece1");
    expect(body.find(b => b.id === "2")?.meta.bgColor).toBe("#FFCC66");
    expect(body.find(b => b.id === "3")?.meta.bgColor).toBe("#f2dcdb");
  });

  test("renders Study Time section", () => {
    const w1 = new WorkItem(createWorkItemDto({ id: 1, title: "[Study Time] Learn vitest" }));
    generatePdfReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", [w1]);

    expect(mockAutoTable).toHaveBeenCalled();
    // Verification that a section for Study Time was passed
    const calls = mockAutoTable.mock.calls;
    const studyTimeCall = calls.find(call => {
      const options = call[1] as { body: { description: string }[] };
      return options.body.some(b => b.description.includes("Learn vitest"));
    });
    expect(studyTimeCall).toBeDefined();
  });

  test("generates multi-team PDF report successfully", async () => {
    const w1 = new WorkItem(createWorkItemDto({ id: 1, state: "Done", title: "PBI Team 1" }));
    const w2 = new WorkItem(createWorkItemDto({ id: 2, state: "Done", title: "PBI Team 2" }));

    const teamWorkItems = [
      { team: "Team 1", workItems: [w1] },
      { team: "Team 2", workItems: [w2], backgroundColor: "#00FF00" }
    ];

    await generateMultiTeamPdfReport(mockSaveFile, "http://origin", "collection", "project", "sprint", teamWorkItems);

    expect(mockAddPage).toHaveBeenCalled();
    expect(mockSaveFile).toHaveBeenCalled();
  });

  describe("Acceptance Criteria reports", () => {
    beforeEach(() => {
      mockText.mockClear();
      mockAddPage.mockClear();
      mockLink.mockClear();
      mockAutoTable.mockClear();
      mockSaveFile.mockClear();
    });

    function getTextCalls(): string[] {
      return mockText.mock.calls.map(call => call[0] as string);
    }

    test("renders a heading per work item in '<Type_Prefix> <Id> - <Title>' format", () => {
      const workItems = [new WorkItem(createWorkItemDto({ id: 42, title: "Implement login", acceptanceCriteria: "User can log in" })), new WorkItem(createWorkItemDto({ id: 43, title: "Implement logout", acceptanceCriteria: "User can log out" }))];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("Story 42 - Implement login");
      expect(textCalls).toContain("Story 43 - Implement logout");
    });

    test("prefixes headings with the correct work item type", () => {
      const workItems = [
        new WorkItem(createWorkItemDto({ id: 1, title: "Backlog item", workItemType: "Product Backlog Item", acceptanceCriteria: "AC" })),
        new WorkItem(createWorkItemDto({ id: 2, title: "Defect", workItemType: "Bug", acceptanceCriteria: "AC" })),
        new WorkItem(createWorkItemDto({ id: 3, title: "Narrative", workItemType: "User Story", acceptanceCriteria: "AC" }))
      ];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("PBI 1 - Backlog item");
      expect(textCalls).toContain("Bug 2 - Defect");
      expect(textCalls).toContain("Story 3 - Narrative");
    });

    test("groups work items under status sub-headings with Completed first, then In Progress, then Not Started", () => {
      const taskDto = createWorkItemDto({ state: "In Progress" });
      const workItems = [
        new WorkItem(createWorkItemDto({ id: 1, title: "Zebra Not Started", acceptanceCriteria: "AC" })),
        new WorkItem(createWorkItemDto({ id: 2, title: "Alpha Not Started", acceptanceCriteria: "AC" })),
        new WorkItem(createWorkItemDto({ id: 3, title: "Done Item", state: "Done", acceptanceCriteria: "AC" })),
        new WorkItem({ ...createWorkItemDto({ id: 4, title: "Active Item", acceptanceCriteria: "AC" }), children: [taskDto] })
      ];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      const completedIndex = textCalls.indexOf("Completed");
      const inProgressIndex = textCalls.indexOf("In Progress");
      const notStartedIndex = textCalls.indexOf("Not Started");

      expect(completedIndex).toBeGreaterThanOrEqual(0);
      expect(inProgressIndex).toBeGreaterThan(completedIndex);
      expect(notStartedIndex).toBeGreaterThan(inProgressIndex);

      const doneItemIndex = textCalls.indexOf("Story 3 - Done Item");
      const inProgressItemIndex = textCalls.indexOf("Story 4 - Active Item");
      const zebraIndex = textCalls.indexOf("Story 1 - Zebra Not Started");
      const alphaIndex = textCalls.indexOf("Story 2 - Alpha Not Started");

      expect(doneItemIndex).toBeGreaterThan(completedIndex);
      expect(doneItemIndex).toBeLessThan(inProgressIndex);
      expect(inProgressItemIndex).toBeGreaterThan(inProgressIndex);
      expect(inProgressItemIndex).toBeLessThan(notStartedIndex);
      expect(alphaIndex).toBeGreaterThan(notStartedIndex);
      expect(zebraIndex).toBeGreaterThan(alphaIndex);
    });

    test("skips status sub-headings for empty sections", () => {
      const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "Only Not Started", acceptanceCriteria: "AC" }))];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("Not Started");
      expect(textCalls).not.toContain("Completed");
      expect(textCalls).not.toContain("In Progress");
      expect(textCalls).not.toContain("Removed");
      expect(textCalls).not.toContain("Study Time");
    });

    test("links each heading to its work item", () => {
      const workItems = [
        new WorkItem(createWorkItemDto({ id: 42, title: "Implement login", workItemType: "Product Backlog Item", acceptanceCriteria: "User can log in" })),
        new WorkItem(createWorkItemDto({ id: 43, title: "Implement logout", workItemType: "Bug", acceptanceCriteria: "User can log out" }))
      ];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const linkUrls = mockLink.mock.calls.map(call => call[4]?.url);
      expect(linkUrls).toContain("http://origin/collection/project/_workitems/edit/42");
      expect(linkUrls).toContain("http://origin/collection/project/_workitems/edit/43");
    });

    test("renders acceptance criteria as plain text with bullets, stripping HTML", () => {
      const workItems = [
        new WorkItem(
          createWorkItemDto({
            id: 7,
            title: "Search feature",
            acceptanceCriteria: "<div><ul><li>User can search &amp; filter</li><li>Results are sorted</li></ul></div>"
          })
        )
      ];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("• User can search & filter");
      expect(textCalls).toContain("• Results are sorted");
      expect(textCalls.some(text => text.includes("<li>") || text.includes("<div>"))).toBe(false);
    });

    test("shows placeholder text when a PBI has no acceptance criteria", () => {
      const workItems = [new WorkItem(createWorkItemDto({ id: 9, title: "No AC PBI" }))];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      expect(getTextCalls()).toContain("No acceptance criteria defined.");
    });

    test("renders markdown acceptance criteria with bullets and emphasis stripped", () => {
      const workItems = [
        new WorkItem(
          createWorkItemDto({
            id: 8,
            title: "Markdown AC",
            acceptanceCriteria: "**Given** the user is logged in\n- When they log out\n- Then the session ends"
          })
        )
      ];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("Given the user is logged in");
      expect(textCalls).toContain("• When they log out");
      expect(textCalls).toContain("• Then the session ends");
    });

    test("does not render the commitment text in the team banner", () => {
      const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      const textCalls = getTextCalls();
      expect(textCalls).toContain("team - sprint");
      expect(textCalls.some(text => text.includes("% Commitment"))).toBe(false);
    });

    test("saves the single team report with an acceptance criteria filename", () => {
      const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

      generateAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

      expect(mockSaveFile).toHaveBeenCalledWith(expect.anything(), "team - sprint - Acceptance Criteria.pdf", "application/pdf");
    });

    test("generates multi-team report with one page per team and no commitment text", async () => {
      const w1 = new WorkItem(createWorkItemDto({ id: 1, title: "PBI Team 1", acceptanceCriteria: "Criterion A" }));
      const w2 = new WorkItem(createWorkItemDto({ id: 2, title: "PBI Team 2", acceptanceCriteria: "Criterion B" }));

      const teamWorkItems = [
        { team: "Team 1", workItems: [w1] },
        { team: "Team 2", workItems: [w2], backgroundColor: "#00FF00" }
      ];

      await generateMultiTeamAcceptanceCriteriaReport(mockSaveFile, "http://origin", "collection", "project", "sprint", teamWorkItems);

      expect(mockAddPage).toHaveBeenCalledTimes(1);
      expect(getTextCalls().some(text => text.includes("% Commitment"))).toBe(false);
      expect(mockSaveFile).toHaveBeenCalledWith(expect.anything(), "Multi-Team (Team 1, Team 2) - sprint - Acceptance Criteria.pdf", "application/pdf");
    });
  });
});
