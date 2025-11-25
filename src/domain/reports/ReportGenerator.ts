import { type CellObject, type CellStyle, utils, writeFile } from "xlsx-js-style";
import { formatName } from "../../utils/formatName";
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

function getExtraStyles(workItem: WorkItem): CellStyle {
  const result: CellStyle = {};
  if (workItem.sprint?.sprintNumber && workItem.sprintTag?.sprintNumber) {
    if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "+") {
      result.fill = { fgColor: { rgb: "F4F785" } };
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "!") {
      result.fill = { fgColor: { rgb: "FFCC66" } };
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber - 1 && workItem.sprintTag.sprintSuffix !== "+") {
      result.fill = { fgColor: { rgb: "E6B8B7" } };
    }
  }
  if (workItem.isInProgress && workItem.allTasksDone && result.font) {
    result.font.bold = true;
  }
  return result;
}

export interface TeamWorkItems {
  team: string;
  workItems: WorkItem[];
  backgroundColor?: string;
}

interface ReportContext {
  origin: string;
  collection: string;
  project: string;
}

function addSectionHeader(rows: CellObject[][], merges: Range[], title: string) {
  merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
  rows.push([new Cell(title).font(headerFont)]);
}

function addColumnHeaders(rows: CellObject[][]) {
  rows.push([
    new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
    new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
  ]);
}

function addWorkItemRows(rows: CellObject[][], workItems: WorkItem[], context: ReportContext) {
  workItems.forEach(x => {
    rows.push([
      new Cell(x.id).alignText(centerAlign).link(`${context.origin}/${context.collection}/${context.project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
      new Cell(x.wiseNumber ?? "").alignText(centerAlign).link(x.wiseLink),
      new Cell(x.title).alignText({ horizontal: "left" }),
      new Cell(formatName(x.owner)).alignText(centerAlign)
    ]);
  });
}

function addWorkItemSection(rows: CellObject[][], merges: Range[], title: string, workItems: WorkItem[], context: ReportContext, includeDoneWiseColumn: boolean) {
  if (workItems.length === 0) return;

  addSectionHeader(rows, merges, title);
  addColumnHeaders(rows);

  workItems.forEach(x => {
    rows.push([
      new Cell(x.id).alignText(centerAlign).link(`${context.origin}/${context.collection}/${context.project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
      includeDoneWiseColumn ? new Cell(x.wiseNumber ?? "").alignText(centerAlign).link(x.wiseLink) : new Cell("").alignText(centerAlign),
      new Cell(x.title).alignText({ horizontal: "left" }),
      new Cell(formatName(x.owner)).alignText(centerAlign)
    ]);
  });

  rows.push([new Cell("")]);
}

function addTeamWorkItems(rows: CellObject[][], merges: Range[], workItems: WorkItem[], context: ReportContext) {
  const workItemCollection = new WorkItemCollection(workItems);

  addWorkItemSection(rows, merges, "Completed", workItemCollection.done, context, true);
  addWorkItemSection(rows, merges, "In Progress", workItemCollection.inProgress, context, false);
  addWorkItemSection(rows, merges, "Not Started", workItemCollection.notStarted, context, false);
  addWorkItemSection(rows, merges, "Removed", workItemCollection.removed, context, false);

  if (workItemCollection.studyTime.length) {
    addSectionHeader(rows, merges, "Study Time");
    addColumnHeaders(rows);
    addWorkItemRows(rows, workItemCollection.studyTime, context);
  }
}

export function generateReport(origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[]) {
  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];
  const context: ReportContext = { origin, collection, project };

  addTeamWorkItems(rows, merges, workItems, context);

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [{ wpx: 96 * 0.85714 }, { wpx: 75 * 0.85714 }, { wpx: 705 * 0.85714 }, { wpx: 82 * 0.85714, hidden: true }];

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  writeFile(workbook, `${team} - ${sprint}.xlsx`);
}

export function generateMultiTeamReport(origin: string, collection: string, project: string, sprint: string, teamWorkItems: TeamWorkItems[]) {
  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];
  const context: ReportContext = { origin, collection, project };

  teamWorkItems.forEach((teamData, index) => {
    // Add team header
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell(teamData.team).font(teamHeaderFont).backgroundColor(teamData.backgroundColor)]);
    rows.push([new Cell("")]);

    // Add team's work items
    addTeamWorkItems(rows, merges, teamData.workItems, context);

    // Add spacing between teams (except after last team)
    if (index < teamWorkItems.length - 1) {
      rows.push([new Cell("")]);
      rows.push([new Cell("")]);
    }
  });

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [{ wpx: 96 * 0.85714 }, { wpx: 75 * 0.85714 }, { wpx: 705 * 0.85714 }, { wpx: 82 * 0.85714, hidden: true }];

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  writeFile(workbook, `Multi-Team (${teamNames}) - ${sprint}.xlsx`);
}
