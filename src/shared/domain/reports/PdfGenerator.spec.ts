import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkItemDto } from "../../api/query/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generatePdfReport } from "./PdfGenerator";

const mockAutoTable = vi.fn();
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
      Tags: "",
      State: overrides.state ?? "New",
      AssignedTo: null,
      Title: overrides.title ?? "Test Work Item",
      IterationPath: "TestProject\\Sprint 1",
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
});
