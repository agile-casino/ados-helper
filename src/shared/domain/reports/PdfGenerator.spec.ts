import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkItemDto } from "../../api/query/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generateMultiTeamPdfReport, generatePdfReport } from "./PdfGenerator";

const mockAutoTable = vi.fn().mockImplementation((_doc, options) => {
  if (options && options.body && Array.isArray(options.body)) {
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
  }>
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
        ...(overrides.activatedDate ? { Common: { ActivatedDate: overrides.activatedDate } } : {}),
        Scheduling: {
          Effort: 3,
          RemainingWork: 0
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
});
