import { BorderStyle, convertMillimetersToTwip, Document, ExternalHyperlink, Footer, Packer, PageNumber, Paragraph, ShadingType, Tab, Table, TableCell, TableRow, TabStopType, TextRun, WidthType } from "docx";
import { toPlainText } from "../../utils/toPlainText";
import type { WorkItem } from "../WorkItem";
import { WorkItemCollection } from "../WorkItemCollection";
import type { TeamWorkItems } from "./ReportGenerator";
import { getWorkItemTypePrefix } from "./workItemType";

const WORD_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SLATE_500 = "64748B";
const SLATE_700 = "334155";
const SLATE_800 = "1E293B";
const SLATE_900 = "0F172A";
const DEFAULT_BANNER_COLOR = "F3F4F6";

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
};

const BULLET_LINE = /^(\s*)•\s?(.*)$/;

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
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: toHexColor(backgroundColor) },
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${teamName} - ${sprintName}`, bold: true, size: 26, color: SLATE_800 })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createSectionTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text: title, bold: true, size: 28, color: SLATE_800 })]
  });
}

function createWorkItemHeading(workItem: WorkItem, context: DocxReportContext): Paragraph {
  const typePrefix = getWorkItemTypePrefix(workItem.workItemType);
  const headingText = `${typePrefix} ${workItem.id} - ${workItem.title}`;
  return new Paragraph({
    spacing: { before: 160, after: 40 },
    children: [
      new ExternalHyperlink({
        children: [new TextRun({ text: headingText, bold: true, size: 24, color: SLATE_700 })],
        link: `${context.origin}/${context.collection}/${context.project}/_workitems/edit/${workItem.id}`
      })
    ]
  });
}

function createCriteriaParagraphs(criteriaText: string): Paragraph[] {
  if (!criteriaText.trim()) {
    return [new Paragraph({ children: [new TextRun({ text: "No acceptance criteria defined.", size: 20, color: SLATE_900 })] })];
  }

  return criteriaText.split("\n").map(line => {
    const bulletText = BULLET_LINE.exec(line)?.[2];
    if (bulletText?.trim()) {
      return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: bulletText, size: 20, color: SLATE_900 })]
      });
    }
    if (!line.trim()) {
      return new Paragraph({ spacing: { after: 40 } });
    }
    return new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: line, size: 20, color: SLATE_900 })]
    });
  });
}

function createAcceptanceCriteriaSection(title: string, workItems: WorkItem[], context: DocxReportContext): (Paragraph | Table)[] {
  if (workItems.length === 0) return [];

  return [createSectionTitle(title), ...workItems.flatMap(workItem => [createWorkItemHeading(workItem, context), ...createCriteriaParagraphs(toPlainText(workItem.acceptanceCriteria))])];
}

function createTeamContent(teamName: string, workItems: WorkItem[], context: DocxReportContext, backgroundColor?: string): (Paragraph | Table)[] {
  const workItemCollection = new WorkItemCollection(workItems);

  return [
    createTeamBanner(teamName, context.sprint, backgroundColor),
    new Paragraph({ spacing: { after: 120 } }),
    ...createAcceptanceCriteriaSection("Completed", workItemCollection.done, context),
    ...createAcceptanceCriteriaSection("In Progress", workItemCollection.inProgress, context),
    ...createAcceptanceCriteriaSection("Not Started", workItemCollection.notStarted, context),
    ...createAcceptanceCriteriaSection("Removed", workItemCollection.removed, context),
    ...createAcceptanceCriteriaSection("Study Time", workItemCollection.studyTime, context)
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

async function buildDocx(children: (Paragraph | Table)[]): Promise<Uint8Array> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: SLATE_900 }
        }
      }
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
  const data = await buildDocx(createTeamContent(team, workItems, context));
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
  const data = await buildDocx(children);
  await saveFile(data, `Multi-Team (${teamNames}) - ${sprint} - Acceptance Criteria.docx`, WORD_MIME_TYPE);
}
