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

export function generateReport(origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[]) {
  const workItemCollection = new WorkItemCollection(workItems);

  const workbook = utils.book_new();

  const rows: CellObject[][] = [];
  const merges: Range[] = [];

  if (workItemCollection.done.length) {
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell("Completed").font(headerFont)]);

    rows.push([
      new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
    ]);

    workItemCollection.done.forEach(x => {
      rows.push([
        new Cell(x.id).alignText(centerAlign).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
        new Cell(x.wiseNumber ?? "").alignText(centerAlign).link(x.wiseLink),
        new Cell(x.title).alignText({ horizontal: "left" }),
        new Cell(formatName(x.owner)).alignText(centerAlign)
      ]);
    });

    rows.push([new Cell("")]);
  }

  if (workItemCollection.inProgress.length) {
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell("In Progress").font(headerFont)]);

    rows.push([
      new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
    ]);

    workItemCollection.inProgress.forEach(x => {
      rows.push([
        new Cell(x.id).alignText(centerAlign).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
        new Cell("").alignText(centerAlign),
        new Cell(x.title).alignText({ horizontal: "left" }),
        new Cell(formatName(x.owner)).alignText(centerAlign)
      ]);
    });

    rows.push([new Cell("")]);
  }

  if (workItemCollection.notStarted.length) {
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell("Not Started").font(headerFont)]);

    rows.push([
      new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
    ]);

    workItemCollection.notStarted.forEach(x => {
      rows.push([
        new Cell(x.id).alignText(centerAlign).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
        new Cell("").alignText(centerAlign),
        new Cell(x.title).alignText({ horizontal: "left" }),
        new Cell(formatName(x.owner)).alignText(centerAlign)
      ]);
    });

    rows.push([new Cell("")]);
  }

  if (workItemCollection.removed.length) {
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell("Removed").font(headerFont)]);

    rows.push([
      new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
    ]);

    workItemCollection.removed.forEach(x => {
      rows.push([
        new Cell(x.id).alignText(centerAlign).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
        new Cell("").alignText(centerAlign),
        new Cell(x.title).alignText({ horizontal: "left" }),
        new Cell(formatName(x.owner)).alignText(centerAlign)
      ]);
    });

    rows.push([new Cell("")]);
  }

  if (workItemCollection.studyTime.length) {
    merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
    rows.push([new Cell("Study Time").font(headerFont)]);

    rows.push([
      new Cell("PBI").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("WQ/SDR").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Description").font(headerFont).alignText(centerAlign).borderBottom(thickBlack),
      new Cell("Assignee").font(headerFont).alignText(centerAlign).borderBottom(thickBlack)
    ]);

    workItemCollection.studyTime.forEach(x => {
      rows.push([
        new Cell(x.id).alignText(centerAlign).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
        new Cell("").alignText(centerAlign),
        new Cell(x.title).alignText({ horizontal: "left" }),
        new Cell(formatName(x.owner)).alignText(centerAlign)
      ]);
    });
  }

  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [{ wpx: 96 * 0.85714 }, { wpx: 75 * 0.85714 }, { wpx: 705 * 0.85714 }, { wpx: 82 * 0.85714 }];

  worksheet["!merges"] = merges;

  utils.book_append_sheet(workbook, worksheet, sprint);

  writeFile(workbook, `${team} - ${sprint}.xlsx`);
}
