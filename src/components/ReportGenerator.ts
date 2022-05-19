import * as xlsx from "xlsx-js-style";
import { WorkItemDto } from "../api/queryRepository";
import { formatName } from "../utils/formatName";

export function generateReport(collection: string, project: string, sprint: string, workItems: WorkItemDto[]) {
    const workbook = xlsx.utils.book_new();

    const rows: xlsx.CellObject[][] = [
    ];

    rows.push([
        { v: "Completed", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
    ]);

    rows.push([
        { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
        { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
    ]);

    const doneWorkItems = workItems.filter(workItem => workItem.System.State === "Done");
    doneWorkItems.forEach(x => rows.push([
        { v: x.System.Id, t: "s", l: { Target: `${window.location.origin}/${collection}/${project}/_workitems/edit/${x.System.Id}` }, s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: x.System.Title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
        { v: formatName(x.System.AssignedTo), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
    ]));

    rows.push([
        { v: "", t: "s" }
    ]);

    rows.push([
        { v: "In Progress", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
    ]);

    rows.push([
        { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
        { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
    ]);

    const inProgressWorkItems = workItems?.filter(workItem => workItem.System.State !== "Done" && !workItem.children.every(task => task.System.State === "To Do"));
    inProgressWorkItems.forEach(x => rows.push([
        { v: x.System.Id, t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: x.System.Title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
        { v: formatName(x.System.AssignedTo), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
    ]));

    rows.push([
        { v: "", t: "s" }
    ]);

    rows.push([
        { v: "Not Started", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
    ]);

    rows.push([
        { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
        { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
    ]);

    const notStartedWorkItems = workItems?.filter(workItem => workItem.System.State !== "Done" && workItem.children.every(task => task.System.State === "To Do"));
    notStartedWorkItems.forEach(x => rows.push([
        { v: x.System.Id, t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
        { v: x.System.Title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
        { v: formatName(x.System.AssignedTo), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
    ]));

    const worksheet = xlsx.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
        { wpx: 96  * 0.85714 },
        { wpx: 75  * 0.85714 },
        { wpx: 705 * 0.85714 },
        { wpx: 82  * 0.85714 }
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, sprint);

    xlsx.writeFile(workbook, `${sprint}.xlsx`);
}
