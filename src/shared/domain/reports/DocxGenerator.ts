import { BorderStyle, convertMillimetersToTwip, Document, ExternalHyperlink, Footer, HeadingLevel, Packer, PageNumber, Paragraph, ShadingType, Tab, Table, TableCell, TableRow, TabStopType, TextRun, WidthType } from "docx";
import { toPlainText } from "../../utils/toPlainText";
import type { WorkItem } from "../WorkItem";
import { WorkItemCollection } from "../WorkItemCollection";
import type { TeamWorkItems } from "./ReportGenerator";
import { AC_BULLET_LINE, DEFAULT_BANNER_COLOR, darkenHex, formatSectionTitle, REPORT_SECTIONS, type ReportSectionTheme, SLATE_400, SLATE_500, SLATE_700, SLATE_800, SLATE_900 } from "./reportTheme";
import { getWorkItemTypePrefix } from "./workItemType";

const WORD_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const AC_EMPTY_STATE_TEXT = "No work items found for this sprint.";

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
};

const BODY_LINE_SPACING = 276; // 1.15 line spacing

interface DocxReportContext {
  origin: string;
  collection: string;
  project: string;
  sprint: string;
}

function toHexColor(color: string | undefined): string {
  const hex = color?.replace("#", "");
  return hex ? hex.toUpperCase() : DEFAULT_BANNER_COLOR;
}

function createTeamBanner(teamName: string, sprintName: string, backgroundColor?: string): Table {
  const fill = toHexColor(backgroundColor);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill },
            borders: { left: { style: BorderStyle.SINGLE, size: 24, color: darkenHex(fill, 0.55) } },
            margins: { top: 160, bottom: 160, left: 200, right: 160 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${teamName} - ${sprintName}`, bold: true, size: 28, color: SLATE_800 })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createSectionTitle(section: ReportSectionTheme, count: number): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: section.accent, space: 2 } },
    children: [new TextRun({ text: formatSectionTitle(section, count), bold: true, size: 26, color: section.accent })]
  });
}

function createWorkItemHeading(workItem: WorkItem, context: DocxReportContext): Paragraph {
  const typePrefix = getWorkItemTypePrefix(workItem.workItemType);
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    keepNext: true,
    spacing: { before: 220, after: 60 },
    children: [
      new ExternalHyperlink({
        children: [new TextRun({ text: `${typePrefix} ${workItem.id}`, bold: true, size: 22, color: SLATE_500 }), new TextRun({ text: `  ${workItem.title}`, bold: true, size: 22, color: SLATE_900 })],
        link: `${context.origin}/${context.collection}/${context.project}/_workitems/edit/${workItem.id}`
      })
    ]
  });
}

function createCriteriaParagraphs(criteriaText: string): Paragraph[] {
  if (!criteriaText.trim()) {
    return [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "No acceptance criteria defined.", italics: true, size: 20, color: SLATE_500 })] })];
  }

  return criteriaText.split("\n").map(line => {
    const bulletText = AC_BULLET_LINE.exec(line)?.[1];
    if (bulletText?.trim()) {
      return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40, line: BODY_LINE_SPACING },
        children: [new TextRun({ text: bulletText, size: 20, color: SLATE_700 })]
      });
    }
    if (!line.trim()) {
      return new Paragraph({ spacing: { after: 40, line: BODY_LINE_SPACING } });
    }
    return new Paragraph({
      spacing: { after: 40, line: BODY_LINE_SPACING },
      children: [new TextRun({ text: line, size: 20, color: SLATE_700 })]
    });
  });
}

function createAcceptanceCriteriaSection(section: ReportSectionTheme, workItems: WorkItem[], context: DocxReportContext): (Paragraph | Table)[] {
  if (workItems.length === 0) return [];

  return [createSectionTitle(section, workItems.length), ...workItems.flatMap(workItem => [createWorkItemHeading(workItem, context), ...createCriteriaParagraphs(toPlainText(workItem.acceptanceCriteria))])];
}

function createTeamContent(teamName: string, workItems: WorkItem[], context: DocxReportContext, backgroundColor?: string): (Paragraph | Table)[] {
  const workItemCollection = new WorkItemCollection(workItems);
  const isEmpty = workItemCollection.done.length === 0 && workItemCollection.inProgress.length === 0 && workItemCollection.notStarted.length === 0 && workItemCollection.removed.length === 0 && workItemCollection.studyTime.length === 0;

  return [
    createTeamBanner(teamName, context.sprint, backgroundColor),
    new Paragraph({ spacing: { after: 120 } }),
    ...(isEmpty
      ? [
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: AC_EMPTY_STATE_TEXT, italics: true, size: 20, color: SLATE_400 })]
          })
        ]
      : [
          ...createAcceptanceCriteriaSection(REPORT_SECTIONS.completed, workItemCollection.done, context),
          ...createAcceptanceCriteriaSection(REPORT_SECTIONS.inProgress, workItemCollection.inProgress, context),
          ...createAcceptanceCriteriaSection(REPORT_SECTIONS.notStarted, workItemCollection.notStarted, context),
          ...createAcceptanceCriteriaSection(REPORT_SECTIONS.removed, workItemCollection.removed, context),
          ...createAcceptanceCriteriaSection(REPORT_SECTIONS.studyTime, workItemCollection.studyTime, context)
        ])
  ];
}

function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: convertMillimetersToTwip(182) }],
        children: [
          new TextRun({ text: `Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, size: 16, color: SLATE_500 }),
          new Tab(),
          new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: SLATE_500 })
        ]
      })
    ]
  });
}

async function buildDocx(children: (Paragraph | Table)[], title?: string, subject?: string): Promise<Uint8Array> {
  const doc = new Document({
    ...(title ? { title } : {}),
    ...(subject ? { subject } : {}),
    creator: "ados-helper",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: SLATE_900 }
        }
      },
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 26, bold: true },
          paragraph: { keepNext: true }
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 22, bold: true },
          paragraph: { keepNext: true }
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(14),
              right: convertMillimetersToTwip(14)
            }
          }
        },
        footers: { default: createFooter() },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}

export async function generateAcceptanceCriteriaDocxReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[]) {
  const context: DocxReportContext = { origin, collection, project, sprint };
  const data = await buildDocx(createTeamContent(team, workItems, context), `${team} - ${sprint} - Acceptance Criteria`, "Acceptance Criteria");
  await saveFile(data, `${team} - ${sprint} - Acceptance Criteria.docx`, WORD_MIME_TYPE);
}

export async function generateMultiTeamAcceptanceCriteriaDocxReport(
  saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>,
  origin: string,
  collection: string,
  project: string,
  sprint: string,
  teamWorkItems: TeamWorkItems[]
) {
  const context: DocxReportContext = { origin, collection, project, sprint };

  const children: (Paragraph | Table)[] = [];
  teamWorkItems.forEach((teamData, index) => {
    if (index > 0) {
      children.push(new Paragraph({ pageBreakBefore: true }));
    }
    children.push(...createTeamContent(teamData.team, teamData.workItems, context, teamData.backgroundColor));
  });

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  const data = await buildDocx(children, `Multi-Team (${teamNames}) - ${sprint} - Acceptance Criteria`, "Acceptance Criteria");
  await saveFile(data, `Multi-Team (${teamNames}) - ${sprint} - Acceptance Criteria.docx`, WORD_MIME_TYPE);
}
