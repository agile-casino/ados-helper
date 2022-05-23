import * as xlsx from "xlsx-js-style";
import { WorkItem } from "../domain/WorkItem";
import { formatName } from "../utils/formatName";

export function generateReport(collection: string, project: string, team: string, sprint: string, workItems: WorkItem[]) {
    const workbook = xlsx.utils.book_new();

    const rows: xlsx.CellObject[][] = [
    ];

    const doneWorkItems = workItems.filter(workItem => workItem.isDone);

    if (doneWorkItems.length) {

        rows.push([
            { v: "Completed", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
        ]);

        rows.push([
            { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
            { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        ]);

        doneWorkItems.forEach(x => rows.push([
            { v: x.id, t: "s", l: { Target: `${window.location.origin}/${collection}/${project}/_workitems/edit/${x.id}` }, s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: x.title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
            { v: formatName(x.assignedTo), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
        ]));

        rows.push([
            { v: "", t: "s" }
        ]);
    }

    const inProgressWorkItems = workItems.filter(workItem => workItem.isInProgress);

    if (inProgressWorkItems?.length) {

        rows.push([
            { v: "In Progress", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
        ]);

        rows.push([
            { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
            { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        ]);

        inProgressWorkItems.forEach(x => rows.push([
            { v: x.id, t: "s", l: { Target: `${window.location.origin}/${collection}/${project}/_workitems/edit/${x.id}` }, s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: x.title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
            { v: formatName(x.assignedTo), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
        ]));

        rows.push([
            { v: "", t: "s" }
        ]);
    }

    const notStartedWorkItems = workItems?.filter(workItem => !workItem.isInProgress && !workItem.isDone);

        if (notStartedWorkItems.length) {
        
        rows.push([
            { v: "Not Started", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true } } }
        ]);

        rows.push([
            { v: "PBI", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } as xlsx.CellStyle },
            { v: "WQ\\SDR", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Description", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
            { v: "Assignee", t: "s", s: { font: { name: "Calibri", sz: 12, bold: true }, alignment: { horizontal: "center" }, border: { bottom: { color: { rgb: "000000" }, style: "thick" } } } },
        ]);

        notStartedWorkItems.forEach(x => rows.push([
            { v: x.id, t: "s", l: { Target: `${window.location.origin}/${collection}/${project}/_workitems/edit/${x.id}` }, s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: "", t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } },
            { v: x.title, t: "s", s: { font: { name: "Calibri", sz: 11 } } },
            { v: formatName(x.owner), t: "s", s: { font: { name: "Calibri", sz: 11 }, alignment: { horizontal: "center" } } }
        ]));
    }

    const worksheet = xlsx.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
        { wpx: 96  * 0.85714 },
        { wpx: 75  * 0.85714 },
        { wpx: 705 * 0.85714 },
        { wpx: 82  * 0.85714 }
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, sprint);

    xlsx.writeFile(workbook, `${team} - ${sprint}.xlsx`);
}
