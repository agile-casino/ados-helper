import { type CellObject, type CellStyle, utils, write } from "xlsx-js-style";
import { formatName } from "../../utils/formatName";
import { getRowHighlight, ROW_HIGHLIGHT_ORDER, ROW_HIGHLIGHT_STYLES, type RowHighlight } from "../rowHighlight";
import type { WorkItem } from "../WorkItem";
import { WorkItemCollection } from "../WorkItemCollection";
import { type BorderStyle, Cell, type FontStyle, type TextAlignStyle } from "./Cell";
import { Range } from "./Range";

const thickBlack: BorderStyle = {
  color: "000000",
  style: "thick"
};

const centerAlign: TextAlignStyle = {
  horizontal: "center"
};

const headerFont: FontStyle = {
  size: 12,
  bold: true
};

const teamHeaderFont: FontStyle = {
  size: 14,
  bold: true
};

function getExtraStyles(workItem: WorkItem, sprintStartDate?: Date): CellStyle {
  const result: CellStyle = {};

  const highlight = getRowHighlight(workItem, sprintStartDate);
  if (highlight) {
    // Excel takes the colour without the leading #
    result.fill = { fgColor: { rgb: ROW_HIGHLIGHT_STYLES[highlight].color.slice(1) } };
  }

  if (workItem.allTasksDone) {
    result.font = result.font || {};
    result.font.bold = true;
  }
  return result;
}

export interface TeamWorkItems {
  team: string;
  workItems: WorkItem[];
  backgroundColor?: string | undefined;
  sprintStartDate?: Date | undefined;
}

interface ReportContext {
  origin: string;
  collection: string;
  project: string;
}

/** Colours used in the sheet, in key order. Only highlights present in the sheet are listed. */
function collectHighlights(teams: { workItems: WorkItem[]; sprintStartDate?: Date | undefined }[]): RowHighlight[] {
  const present = new Set<RowHighlight>();
  for (const team of teams) {
    for (const workItem of team.workItems) {
      const highlight = getRowHighlight(workItem, team.sprintStartDate);
      if (highlight) present.add(highlight);
    }
  }
  return ROW_HIGHLIGHT_ORDER.filter(h => present.has(h));
}

/** Column for the key swatch. Columns 0-3 hold the table, 4-6 are hidden, and column 7 is a blank spacer. */
const KEY_COLUMN = 8;

/**
 * Writes the key beside the top of the sheet, in columns to the right of the work items, so it
 * does not add rows above the tables. Column I holds the swatch and column J the label.
 */
function addKeyBesideTables(rows: CellObject[][], highlights: RowHighlight[]) {
  if (highlights.length === 0) return;

  const place = (rowIndex: number, column: number, cell: CellObject) => {
    while (rows.length <= rowIndex) rows.push([]);
    const row = rows[rowIndex] ?? [];
    while (row.length < column) row.push(new Cell(""));
    row[column] = cell;
    rows[rowIndex] = row;
  };

  // Row 0 holds the title; each highlight then takes the next row.
  place(0, KEY_COLUMN, new Cell("Key").font(headerFont));
  highlights.forEach((h, i) => {
    place(i + 1, KEY_COLUMN, new Cell("").backgroundColor(ROW_HIGHLIGHT_STYLES[h].color));
    place(i + 1, KEY_COLUMN + 1, new Cell(ROW_HIGHLIGHT_STYLES[h].label));
  });
}

/** Column widths: the work item columns, a blank spacer, then the key columns (swatch and label). */
const SHEET_COLUMNS = [
  { wpx: 96 * 0.85714 },
  { wpx: 75 * 0.85714 },
  { wpx: 705 * 0.85714 },
  { wpx: 50 * 0.85714 },
  { wpx: 82 * 0.85714, hidden: true },
  { wpx: 120 * 0.85714, hidden: true },
  { wpx: 120 * 0.85714, hidden: true },
  { wpx: 24 },
  { wpx: 24 },
  { wpx: 24 },
  { wpx: 260 }
];

function addSectionHeader(rows: CellObject[][], merges: Range[], title: string) {
  merges.push(new Range().from(rows.length, 0).to(rows.length, 6));
  rows.push([new Cell(title).font(headerFont)]);
}

function addColumnHeaders(rows: CellObject[][]) {
  rows.push([
    new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Size").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Original Estimate").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Completed Work").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
  ]);
}

function addWorkItemRows(rows: CellObject[][], workItems: WorkItem[], context: ReportContext, sprintStartDate?: Date) {
  workItems.forEach(x => {
    rows.push([
      new Cell(x.id).alignText(centerAlign).link(`${context.origin}/${context.collection}/${context.project}/_workitems/edit/${x.id}`).style(getExtraStyles(x, sprintStartDate)),
      new Cell(x.wiseNumber ?? "").alignText(centerAlign).link(x.wiseLink),
      new Cell(x.title).alignText({ horizontal: "left" }),
      new Cell(x.effort ?? "").alignText(centerAlign),
      new Cell(formatName(x.owner)).alignText(centerAlign),
      new Cell(x.originalEstimate ?? "").alignText(centerAlign),
      new Cell(x.completedWork ?? "").alignText(centerAlign)
    ]);
  });
}

function addWorkItemSection(rows: CellObject[][], merges: Range[], title: string, workItems: WorkItem[], context: ReportContext, includeDoneWiseColumn: boolean, sprintStartDate?: Date) {
  if (workItems.length === 0) return;

  addSectionHeader(rows, merges, title);
  addColumnHeaders(rows);

  workItems.forEach(x => {
    rows.push([
      new Cell(x.id).alignText(centerAlign).link(`${context.origin}/${context.collection}/${context.project}/_workitems/edit/${x.id}`).style(getExtraStyles(x, sprintStartDate)),
      includeDoneWiseColumn ? new Cell(x.wiseNumber ?? "").alignText(centerAlign).link(x.wiseLink) : new Cell("").alignText(centerAlign),
      new Cell(x.title).alignText({ horizontal: "left" }),
      new Cell(x.effort ?? "").alignText(centerAlign),
      new Cell(formatName(x.owner)).alignText(centerAlign),
      new Cell(x.originalEstimate ?? "").alignText(centerAlign),
      new Cell(x.completedWork ?? "").alignText(centerAlign)
    ]);
  });

  rows.push([new Cell("")]);
}

function addTeamWorkItems(rows: CellObject[][], merges: Range[], workItems: WorkItem[], context: ReportContext, sprintStartDate?: Date) {
  const workItemCollection = new WorkItemCollection(workItems, sprintStartDate);

  // addStatisticsSummary(rows, merges, workItemCollection);

  addWorkItemSection(rows, merges, "Completed", workItemCollection.done, context, true, sprintStartDate);
  addWorkItemSection(rows, merges, "In Progress", workItemCollection.inProgress, context, false, sprintStartDate);
  addWorkItemSection(rows, merges, "Not Started", workItemCollection.notStarted, context, false, sprintStartDate);
  addWorkItemSection(rows, merges, "Removed", workItemCollection.removed, context, false, sprintStartDate);

  if (workItemCollection.studyTime.length) {
    addSectionHeader(rows, merges, "Study Time");
    addColumnHeaders(rows);
    addWorkItemRows(rows, workItemCollection.studyTime, context, sprintStartDate);
  }
}

export function generateReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[], sprintStartDate?: Date) {
  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];
  const context: ReportContext = { origin, collection, project };

  addTeamWorkItems(rows, merges, workItems, context, sprintStartDate);
  addKeyBesideTables(rows, collectHighlights([{ workItems, sprintStartDate }]));

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = SHEET_COLUMNS;

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  const wbout = write(workbook, { bookType: "xlsx", type: "array" });
  saveFile(new Uint8Array(wbout), `${team} - ${sprint}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function generateMultiTeamReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, sprint: string, teamWorkItems: TeamWorkItems[]) {
  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];
  const context: ReportContext = { origin, collection, project };

  teamWorkItems.forEach((teamData, index) => {
    // Add team header with commitment percentage
    const workItemCollection = new WorkItemCollection(teamData.workItems, teamData.sprintStartDate);
    merges.push(new Range().from(rows.length, 0).to(rows.length, 2));
    rows.push([
      new Cell(teamData.team).font(teamHeaderFont).backgroundColor(teamData.backgroundColor),
      new Cell(""),
      new Cell(""),
      new Cell(`${workItemCollection.commitmentPercentage}%`).font(teamHeaderFont).backgroundColor(teamData.backgroundColor).alignText(centerAlign),
      new Cell("").backgroundColor(teamData.backgroundColor),
      new Cell("").backgroundColor(teamData.backgroundColor),
      new Cell("").backgroundColor(teamData.backgroundColor)
    ]);
    rows.push([new Cell("")]);

    // Add team's work items
    addTeamWorkItems(rows, merges, teamData.workItems, context, teamData.sprintStartDate);

    // Add spacing between teams (except after last team)
    if (index < teamWorkItems.length - 1) {
      rows.push([new Cell("")]);
      rows.push([new Cell("")]);
    }
  });

  addKeyBesideTables(rows, collectHighlights(teamWorkItems));

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = SHEET_COLUMNS;

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  const wbout = write(workbook, { bookType: "xlsx", type: "array" });
  saveFile(new Uint8Array(wbout), `Multi-Team (${teamNames}) - ${sprint}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
