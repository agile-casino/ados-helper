import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkItemDto } from "../../api/query/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generatePdfReport } from "./PdfGenerator";

const mockAutoTable = vi.fn();
vi.mock("jspdf-autotable", () => ({
  default: (...args: unknown[]) => mockAutoTable(...args)
}));

const mockSave = vi.fn();
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
  }>
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
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
  });

  test("hides WQ/SDR column if no work item has a WQ/SDR", () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, state: "Done", title: "PBI 1" }))];
    generatePdfReport("http://origin", "collection", "project", "team", "sprint", workItems);

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
    generatePdfReport("http://origin", "collection", "project", "team", "sprint", workItems);

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
});
