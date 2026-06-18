import { type CellObject, type CellStyle, utils, write } from "xlsx-js-style";
import { formatName } from "../../utils/formatName";
import { saveFile } from "../../utils/saveFile";
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

  // Tag-based color coding for yellow and orange
  if (workItem.sprint?.sprintNumber && workItem.sprintTag?.sprintNumber) {
    if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "+") {
      result.fill = { fgColor: { rgb: "eeece1" } };
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "!") {
      result.fill = { fgColor: { rgb: "FFCC66" } };
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber - 1 && workItem.sprintTag.sprintSuffix !== "+") {
      result.fill = { fgColor: { rgb: "f2dcdb" } };
    }
  }

  // Date-based color coding (only if no tag-based color applied)
  if (!result.fill && sprintStartDate) {
    // Yellow for PBIs pulled in late (activated > 2 days after sprint start)
    if (workItem.isPulledInLate(sprintStartDate)) {
      result.fill = { fgColor: { rgb: "eeece1" } };
    }
    // Pink for PBIs activated before sprint start
    else if (workItem.activatedDate && workItem.activatedDate < sprintStartDate) {
      result.fill = { fgColor: { rgb: "f2dcdb" } };
    }
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

export function generateReport(origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[], sprintStartDate?: Date) {
  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];
  const context: ReportContext = { origin, collection, project };

  addTeamWorkItems(rows, merges, workItems, context, sprintStartDate);

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [{ wpx: 96 * 0.85714 }, { wpx: 75 * 0.85714 }, { wpx: 705 * 0.85714 }, { wpx: 50 * 0.85714 }, { wpx: 82 * 0.85714, hidden: true }, { wpx: 120 * 0.85714, hidden: true }, { wpx: 120 * 0.85714, hidden: true }];

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  const wbout = write(workbook, { bookType: "xlsx", type: "array" });
  saveFile(new Uint8Array(wbout), `${team} - ${sprint}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function generateMultiTeamReport(origin: string, collection: string, project: string, sprint: string, teamWorkItems: TeamWorkItems[]) {
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

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [{ wpx: 96 * 0.85714 }, { wpx: 75 * 0.85714 }, { wpx: 705 * 0.85714 }, { wpx: 50 * 0.85714 }, { wpx: 82 * 0.85714, hidden: true }, { wpx: 120 * 0.85714, hidden: true }, { wpx: 120 * 0.85714, hidden: true }];

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  const wbout = write(workbook, { bookType: "xlsx", type: "array" });
  saveFile(new Uint8Array(wbout), `Multi-Team (${teamNames}) - ${sprint}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
