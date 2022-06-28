import { CellObject, CellStyle, utils, writeFile } from "xlsx-js-style";
import { WorkItem } from "../WorkItem";
import { formatName } from "../../utils/formatName";
import { Cell } from "./Cell";
import { Range } from "./Range";
import { WorkItemCollection } from "../WorkItemCollection";

function getExtraStyles(workItem: WorkItem): CellStyle {
    const result: CellStyle = {
        font: {
            name: "Calibri",
            sz: 11
        }
    };
    if (workItem.sprint?.sprintNumber && workItem.sprintTag?.sprintNumber) {
        if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "+") {
            result.fill = { fgColor: { rgb: "F4F785" } };
        }
        else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "!") {
            result.fill = { fgColor: { rgb: "FFCC66" } };
        }
        else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber - 1 && workItem.sprintTag.sprintSuffix !== "+") {
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
        rows.push([
            new Cell("Completed").font({ size: 12, bold: true })
        ]);

        rows.push([
            new Cell("PBI").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("WQ/SDR").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Description").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Assignee").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"})
        ]);

        workItemCollection.done.forEach(x => rows.push([
            new Cell(x.id).alignText({ horizontal: "center" }).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
            new Cell(x.wiseNumber ?? "").alignText({ horizontal: "center" }).link(x.wiseLink),
            new Cell(x.title).alignText({ horizontal: "left" }),
            new Cell(formatName(x.owner)).alignText({ horizontal: "center" })
        ]));

        rows.push([
            new Cell("")
        ]);
    }

    if (workItemCollection.inProgress.length) {

        merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
        rows.push([
            new Cell("In Progress").font({ size: 12, bold: true })
        ]);

        rows.push([
            new Cell("PBI").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("WQ/SDR").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Description").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Assignee").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"})
        ]);

        workItemCollection.inProgress.forEach(x => rows.push([
            new Cell(x.id).alignText({ horizontal: "center" }).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
            new Cell("").alignText({ horizontal: "center" }),
            new Cell(x.title).alignText({ horizontal: "left" }),
            new Cell(formatName(x.owner)).alignText({ horizontal: "center" })
        ]));

        rows.push([
            new Cell("")
        ]);
    }

    if (workItemCollection.notStarted.length) {
        
        merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
        rows.push([
            new Cell("Not Started").font({ size: 12, bold: true })
        ]);

        rows.push([
            new Cell("PBI").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("WQ/SDR").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Description").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Assignee").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"})
        ]);

        workItemCollection.notStarted.forEach(x => rows.push([
            new Cell(x.id).alignText({ horizontal: "center" }).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
            new Cell("").alignText({ horizontal: "center" }),
            new Cell(x.title).alignText({ horizontal: "left" }),
            new Cell(formatName(x.owner)).alignText({ horizontal: "center" })
        ]));

        rows.push([
            new Cell("")
        ]);
    }

    if (workItemCollection.removed.length) {
        
        merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
        rows.push([
            new Cell("Removed").font({ size: 12, bold: true })
        ]);

        rows.push([
            new Cell("PBI").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("WQ/SDR").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Description").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Assignee").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"})
        ]);

        workItemCollection.removed.forEach(x => rows.push([
            new Cell(x.id).alignText({ horizontal: "center" }).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
            new Cell("").alignText({ horizontal: "center" }),
            new Cell(x.title).alignText({ horizontal: "left" }),
            new Cell(formatName(x.owner)).alignText({ horizontal: "center" })
        ]));

        rows.push([
            new Cell("")
        ]);
    }

    if (workItemCollection.studyTime.length) {
        
        merges.push(new Range().from(rows.length, 0).to(rows.length, 3));
        rows.push([
            new Cell("Study Time").font({ size: 12, bold: true })
        ]);

        rows.push([
            new Cell("PBI").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("WQ/SDR").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Description").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"}),
            new Cell("Assignee").font({ size: 12, bold: true }).alignText({ horizontal: "center" }).borderBottom({ color: "000000", style: "thick"})
        ]);

        workItemCollection.studyTime.forEach(x => rows.push([
            new Cell(x.id).alignText({ horizontal: "center" }).link(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`).style(getExtraStyles(x)),
            new Cell("").alignText({ horizontal: "center" }),
            new Cell(x.title).alignText({ horizontal: "left" }),
            new Cell(formatName(x.owner)).alignText({ horizontal: "center" })
        ]));
    }

    const worksheet = utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
        { wpx: 96  * 0.85714 },
        { wpx: 75  * 0.85714 },
        { wpx: 705 * 0.85714 },
        { wpx: 82  * 0.85714 }
    ];

    worksheet["!merges"] = merges;

    utils.book_append_sheet(workbook, worksheet, sprint);

    writeFile(workbook, `${team} - ${sprint}.xlsx`);
}
