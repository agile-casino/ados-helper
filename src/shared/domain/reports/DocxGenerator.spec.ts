import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkItemDto } from "../../api/WorkItemDto";
import { WorkItem } from "../WorkItem";
import { generateAcceptanceCriteriaDocxReport, generateMultiTeamAcceptanceCriteriaDocxReport } from "./DocxGenerator";

interface MockNode {
  ctor: string;
  props: Record<string, unknown> | undefined;
}

const constructorMocks = vi.hoisted(() => new Map<string, ReturnType<typeof vi.fn>>());

function getConstructorMock(name: string): ReturnType<typeof vi.fn> {
  let mock = constructorMocks.get(name);
  if (!mock) {
    // biome-ignore lint/complexity/useArrowFunction: mocked docx classes are instantiated with `new`
    mock = vi.fn(function (props?: Record<string, unknown>) {
      return { ctor: name, props } as MockNode;
    });
    constructorMocks.set(name, mock);
  }
  return mock;
}

vi.mock("docx", () => {
  return {
    BorderStyle: { NONE: "none", SINGLE: "single" },
    Document: getConstructorMock("Document"),
    ExternalHyperlink: getConstructorMock("ExternalHyperlink"),
    Footer: getConstructorMock("Footer"),
    HeadingLevel: { HEADING_2: "Heading2", HEADING_3: "Heading3" },
    PageNumber: { CURRENT: "CURRENT", TOTAL_PAGES: "TOTAL_PAGES" },
    Packer: {
      toBlob: vi.fn().mockResolvedValue(new Blob([new Uint8Array([0x50, 0x4b])]))
    },
    Paragraph: getConstructorMock("Paragraph"),
    ShadingType: { CLEAR: "clear" },
    Tab: getConstructorMock("Tab"),
    TabStopType: { RIGHT: "right" },
    Table: getConstructorMock("Table"),
    TableCell: getConstructorMock("TableCell"),
    TableRow: getConstructorMock("TableRow"),
    TextRun: getConstructorMock("TextRun"),
    WidthType: { PERCENTAGE: "pct" },
    convertMillimetersToTwip: (mm: number) => Math.round(mm * 56.7)
  };
});

const mockSaveFile = vi.fn().mockResolvedValue(undefined);

function getNodes(name: string): MockNode[] {
  const mock = constructorMocks.get(name);
  return (mock?.mock.calls ?? []).map(call => ({ ctor: name, props: call[0] as Record<string, unknown> | undefined }));
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node !== "object" || node === null) return "";
  const props = (node as MockNode).props;
  if (!props) return "";
  if (typeof props["text"] === "string") return props["text"];
  if (Array.isArray(props["children"])) return (props["children"] as unknown[]).map(extractText).join("");
  return "";
}

function getParagraphTexts(): string[] {
  return getNodes("Paragraph").map(paragraph => extractText({ props: paragraph.props }));
}

function getParagraphProps(): Record<string, unknown>[] {
  return getNodes("Paragraph").map(paragraph => paragraph.props ?? {});
}

function getLinkUrls(): string[] {
  return getNodes("ExternalHyperlink")
    .map(node => node.props?.["link"])
    .filter((link): link is string => typeof link === "string");
}

function getHyperlinkTexts(): string[] {
  return getNodes("ExternalHyperlink").map(node => extractText({ props: node.props }));
}

function getParagraphByText(text: string): Record<string, unknown> {
  const paragraph = getParagraphProps().find(props => extractText({ props }) === text);
  if (!paragraph) {
    throw new Error(`Expected a paragraph with text "${text}"`);
  }
  return paragraph;
}

function createWorkItemDto(
  overrides: Partial<{
    id: number;
    state: string;
    title: string;
    tags: string;
    iterationPath: string;
    links: string[];
    acceptanceCriteria: string;
    workItemType: string;
  }>
): WorkItemDto {
  return {
    Microsoft: {
      VSTS: {
        Common: overrides.acceptanceCriteria
          ? {
              ActivatedDate: undefined,
              AcceptanceCriteria: overrides.acceptanceCriteria
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

describe("DocxGenerator", () => {
  beforeEach(() => {
    for (const mock of constructorMocks.values()) {
      mock.mockClear();
    }
    mockSaveFile.mockClear();
  });

  test("renders a heading per work item with '<Type_Prefix> <Id>' followed by the title", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 42, title: "Implement login", acceptanceCriteria: "User can log in" })), new WorkItem(createWorkItemDto({ id: 43, title: "Implement logout", acceptanceCriteria: "User can log out" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getHyperlinkTexts();
    const login = texts.find(text => text.includes("Implement login"));
    const logout = texts.find(text => text.includes("Implement logout"));
    expect(login?.startsWith("Story 42")).toBe(true);
    expect(logout?.startsWith("Story 43")).toBe(true);
  });

  test("prefixes headings with the correct work item type", async () => {
    const workItems = [
      new WorkItem(createWorkItemDto({ id: 1, title: "Backlog item", workItemType: "Product Backlog Item", acceptanceCriteria: "AC" })),
      new WorkItem(createWorkItemDto({ id: 2, title: "Defect", workItemType: "Bug", acceptanceCriteria: "AC" })),
      new WorkItem(createWorkItemDto({ id: 3, title: "Narrative", workItemType: "User Story", acceptanceCriteria: "AC" }))
    ];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getHyperlinkTexts();
    expect(texts.some(text => text.startsWith("PBI 1") && text.includes("Backlog item"))).toBe(true);
    expect(texts.some(text => text.startsWith("Bug 2") && text.includes("Defect"))).toBe(true);
    expect(texts.some(text => text.startsWith("Story 3") && text.includes("Narrative"))).toBe(true);
  });

  test("groups work items under status sub-headings with Completed first, then In Progress, then Not Started", async () => {
    const taskDto = createWorkItemDto({ state: "In Progress" });
    const workItems = [
      new WorkItem(createWorkItemDto({ id: 1, title: "Zebra Not Started", acceptanceCriteria: "AC" })),
      new WorkItem(createWorkItemDto({ id: 2, title: "Alpha Not Started", acceptanceCriteria: "AC" })),
      new WorkItem(createWorkItemDto({ id: 3, title: "Done Item", state: "Done", acceptanceCriteria: "AC" })),
      new WorkItem({ ...createWorkItemDto({ id: 4, title: "Active Item", acceptanceCriteria: "AC" }), children: [taskDto] })
    ];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getParagraphTexts();
    const completedIndex = texts.indexOf("Completed (1)");
    const inProgressIndex = texts.indexOf("In Progress (1)");
    const notStartedIndex = texts.indexOf("Not Started (2)");

    expect(completedIndex).toBeGreaterThanOrEqual(0);
    expect(inProgressIndex).toBeGreaterThan(completedIndex);
    expect(notStartedIndex).toBeGreaterThan(inProgressIndex);

    const doneItemIndex = texts.findIndex(text => text.startsWith("Story 3"));
    const inProgressItemIndex = texts.findIndex(text => text.startsWith("Story 4"));
    const zebraIndex = texts.findIndex(text => text.startsWith("Story 1"));
    const alphaIndex = texts.findIndex(text => text.startsWith("Story 2"));

    expect(doneItemIndex).toBeGreaterThan(completedIndex);
    expect(doneItemIndex).toBeLessThan(inProgressIndex);
    expect(inProgressItemIndex).toBeGreaterThan(inProgressIndex);
    expect(inProgressItemIndex).toBeLessThan(notStartedIndex);
    expect(alphaIndex).toBeGreaterThan(notStartedIndex);
    expect(zebraIndex).toBeGreaterThan(alphaIndex);
  });

  test("skips status sub-headings for empty sections", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "Only Not Started", acceptanceCriteria: "AC" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getParagraphTexts();
    expect(texts).toContain("Not Started (1)");
    expect(texts.some(text => text.startsWith("Completed"))).toBe(false);
    expect(texts.some(text => text.startsWith("In Progress"))).toBe(false);
    expect(texts.some(text => text.startsWith("Removed"))).toBe(false);
    expect(texts.some(text => text.startsWith("Study Time"))).toBe(false);
  });

  test("links each heading to its work item", async () => {
    const workItems = [
      new WorkItem(createWorkItemDto({ id: 42, title: "Implement login", workItemType: "Product Backlog Item", acceptanceCriteria: "User can log in" })),
      new WorkItem(createWorkItemDto({ id: 43, title: "Implement logout", workItemType: "Bug", acceptanceCriteria: "User can log out" }))
    ];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const linkUrls = getLinkUrls();
    expect(linkUrls).toContain("http://origin/collection/project/_workitems/edit/42");
    expect(linkUrls).toContain("http://origin/collection/project/_workitems/edit/43");
  });

  test("renders HTML acceptance criteria as bullet list items, stripping markup", async () => {
    const workItems = [
      new WorkItem(
        createWorkItemDto({
          id: 7,
          title: "Search feature",
          acceptanceCriteria: "<div><ul><li>User can search &amp; filter</li><li>Results are sorted</li></ul></div>"
        })
      )
    ];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const bulletParagraphs = getParagraphProps().filter(props => props["bullet"]);
    const bulletTexts = bulletParagraphs.map(props => extractText({ props }));
    expect(bulletTexts).toContain("User can search & filter");
    expect(bulletTexts).toContain("Results are sorted");
    expect(bulletParagraphs.every(props => (props["bullet"] as { level: number }).level === 0)).toBe(true);
    expect(getParagraphTexts().some(text => text.includes("<li>") || text.includes("<div>"))).toBe(false);
  });

  test("renders markdown acceptance criteria with bullets and emphasis stripped", async () => {
    const workItems = [
      new WorkItem(
        createWorkItemDto({
          id: 8,
          title: "Markdown AC",
          acceptanceCriteria: "**Given** the user is logged in\n- When they log out\n- Then the session ends"
        })
      )
    ];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getParagraphTexts();
    expect(texts).toContain("Given the user is logged in");
    const bulletParagraphs = getParagraphProps().filter(props => props["bullet"]);
    const bulletTexts = bulletParagraphs.map(props => extractText({ props }));
    expect(bulletTexts).toContain("When they log out");
    expect(bulletTexts).toContain("Then the session ends");
  });

  test("renders markdown and HTML bullet lines as level 0 bullets", async () => {
    const htmlWorkItem = new WorkItem(createWorkItemDto({ id: 5, title: "HTML bullets", acceptanceCriteria: "<ul><li>First</li></ul>" }));

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", [htmlWorkItem]);
    expect(
      getParagraphProps()
        .filter(props => props["bullet"])
        .map(props => (props["bullet"] as { level: number }).level)
    ).toEqual([0]);

    for (const mock of constructorMocks.values()) {
      mock.mockClear();
    }

    const markdownWorkItem = new WorkItem(createWorkItemDto({ id: 6, title: "Markdown bullets", acceptanceCriteria: "- First" }));
    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", [markdownWorkItem]);
    expect(
      getParagraphProps()
        .filter(props => props["bullet"])
        .map(props => (props["bullet"] as { level: number }).level)
    ).toEqual([0]);
  });

  test("shows placeholder text when a PBI has no acceptance criteria", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 9, title: "No AC PBI" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const placeholder = getParagraphByText("No acceptance criteria defined.");
    const run = (placeholder["children"] as MockNode[])[0];
    expect(run?.props?.["italics"]).toBe(true);
  });

  test("renders a team banner without the commitment text", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getParagraphTexts();
    expect(texts).toContain("team - sprint");
    expect(texts.some(text => text.includes("% Commitment"))).toBe(false);
  });

  test("shades the team banner with the team background colour", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateMultiTeamAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "sprint", [{ team: "Team 1", workItems, backgroundColor: "#00ff00" }]);

    const cell = getNodes("TableCell")[0];
    expect(cell?.props?.["shading"]).toEqual({ type: expect.anything(), fill: "00FF00" });
  });

  test("adds a darkened accent border to the team banner", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateMultiTeamAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "sprint", [{ team: "Team 1", workItems, backgroundColor: "#00ff00" }]);

    const cell = getNodes("TableCell")[0];
    expect(cell?.props?.["borders"]).toEqual({ left: { style: "single", size: 24, color: "008C00" } });
  });

  test("renders the team banner at the top of the report without an 'Acceptance Criteria' eyebrow", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const texts = getParagraphTexts();
    expect(texts[0]).toBe("team - sprint");
    expect(texts).not.toContain("ACCEPTANCE CRITERIA");
  });

  test("styles section titles as Heading 2 with keepNext and the section accent colour", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const sectionTitle = getParagraphByText("Not Started (1)");
    expect(sectionTitle["heading"]).toBe("Heading2");
    expect(sectionTitle["keepNext"]).toBe(true);
    expect(sectionTitle["border"]).toEqual({ bottom: { style: "single", size: 6, color: "64748B", space: 2 } });
  });

  test("styles work item headings as Heading 3 with keepNext", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 42, title: "Implement login", acceptanceCriteria: "User can log in" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const heading = getParagraphProps().find(props => extractText({ props }).includes("Implement login"));
    expect(heading?.["heading"]).toBe("Heading3");
    expect(heading?.["keepNext"]).toBe(true);
  });

  test("saves the single team report with an acceptance criteria filename", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    expect(mockSaveFile).toHaveBeenCalledWith(expect.anything(), "team - sprint - Acceptance Criteria.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  test("generates multi-team report starting each team on a new page", async () => {
    const w1 = new WorkItem(createWorkItemDto({ id: 1, title: "PBI Team 1", acceptanceCriteria: "Criterion A" }));
    const w2 = new WorkItem(createWorkItemDto({ id: 2, title: "PBI Team 2", acceptanceCriteria: "Criterion B" }));

    const teamWorkItems = [
      { team: "Team 1", workItems: [w1] },
      { team: "Team 2", workItems: [w2], backgroundColor: "#00FF00" }
    ];

    await generateMultiTeamAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "sprint", teamWorkItems);

    const pageBreakParagraphs = getParagraphProps().filter(props => props["pageBreakBefore"]);
    expect(pageBreakParagraphs).toHaveLength(1);

    const texts = getParagraphTexts();
    expect(texts).toContain("Team 1 - sprint");
    expect(texts).toContain("Team 2 - sprint");
    expect(texts.some(text => text.includes("% Commitment"))).toBe(false);
    expect(mockSaveFile).toHaveBeenCalledWith(expect.anything(), "Multi-Team (Team 1, Team 2) - sprint - Acceptance Criteria.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  test("renders an empty-state message when a team has no work items", async () => {
    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", []);

    const placeholder = getParagraphByText("No work items found for this sprint.");
    const run = (placeholder["children"] as MockNode[])[0];
    expect(run?.props?.["italics"]).toBe(true);
    expect(getParagraphTexts().some(text => text.startsWith("Completed") || text.startsWith("In Progress"))).toBe(false);
  });

  test("sets document title and subject metadata", async () => {
    const workItems = [new WorkItem(createWorkItemDto({ id: 1, title: "PBI 1", acceptanceCriteria: "Works" }))];

    await generateAcceptanceCriteriaDocxReport(mockSaveFile, "http://origin", "collection", "project", "team", "sprint", workItems);

    const documentProps = getNodes("Document")[0]?.props ?? {};
    expect(documentProps["title"]).toBe("team - sprint - Acceptance Criteria");
    expect(documentProps["subject"]).toBe("Acceptance Criteria");
    expect(documentProps["creator"]).toBe("ados-helper");
  });
});
