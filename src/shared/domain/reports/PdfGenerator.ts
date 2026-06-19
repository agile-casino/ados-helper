import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WorkItem } from "../WorkItem";
import { WorkItemCollection } from "../WorkItemCollection";

export interface TeamWorkItems {
  team: string;
  workItems: WorkItem[];
  backgroundColor?: string | undefined;
  sprintStartDate?: Date | undefined;
}

interface PdfReportContext {
  origin: string;
  collection: string;
  project: string;
  sprint: string;
}

function cleanTextForPdf(text: string): string {
  if (!text) return "";
  return text
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↔/g, "<->")
    .replace(/⇒/g, "=>")
    .replace(/⇐/g, "<=")
    .replace(/⇔/g, "<=>")
    .replace(/–/g, "-") // en-dash
    .replace(/—/g, "--") // em-dash
    .replace(/[‘’]/g, "'") // curly single quotes
    .replace(/[“”]/g, '"') // curly double quotes
    .replace(/…/g, "...")
    .replace(/™/g, "(TM)")
    .replace(/©/g, "(C)")
    .replace(/®/g, "(R)");
}

function getRowStyles(workItem: WorkItem, sprintStartDate?: Date) {
  let bgColor: string | null = null;
  let isBold = false;

  // Tag-based color coding for yellow and orange
  if (workItem.sprint?.sprintNumber && workItem.sprintTag?.sprintNumber) {
    if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "+") {
      bgColor = "#eeece1";
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber && workItem.sprintTag.sprintSuffix === "!") {
      bgColor = "#FFCC66";
    } else if (workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber - 1 && workItem.sprintTag.sprintSuffix !== "+") {
      bgColor = "#f2dcdb";
    }
  }

  // Date-based color coding (only if no tag-based color applied)
  if (!bgColor && sprintStartDate) {
    // Yellow for PBIs pulled in late (activated > 2 days after sprint start)
    if (workItem.isPulledInLate(sprintStartDate)) {
      bgColor = "#eeece1";
    }
    // Pink for PBIs activated > 2 days before sprint start
    else if (workItem.isActivatedEarly(sprintStartDate)) {
      bgColor = "#f2dcdb";
    }
  }

  if (workItem.allTasksDone) {
    isBold = true;
  }

  return { bgColor, isBold };
}

function drawTeamHeaderBanner(doc: jsPDF, teamName: string, sprintName: string, commitment: number, bgColorHex?: string) {
  const width = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const bannerHeight = 16;
  const startY = 15;

  // Fill background
  const fillCol = bgColorHex || "#f3f4f6"; // gray default
  doc.setFillColor(fillCol);
  doc.rect(marginX, startY, width - marginX * 2, bannerHeight, "F");

  // Draw team name & sprint
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor("#1e293b"); // dark slate
  doc.text(cleanTextForPdf(`${teamName} - ${sprintName}`), marginX + 4, startY + 11);

  // Commitment
  doc.text(`${commitment}% Commitment`, width - marginX - 4, startY + 11, { align: "right" });

  return startY + bannerHeight + 10; // return next Y position
}

function addWorkItemSection(doc: jsPDF, title: string, workItems: WorkItem[], context: PdfReportContext, includeDoneWiseColumn: boolean, showWiseColumn: boolean, sprintStartDate?: Date, startY = 40): number {
  if (workItems.length === 0) return startY;

  const marginX = 14;
  const pageHeight = doc.internal.pageSize.getHeight();

  // If there's very little space left, add a new page
  if (startY > pageHeight - 35) {
    doc.addPage();
    startY = 20; // reset Y to top margin
  }

  // Draw Section Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor("#334155"); // Slate 700
  doc.text(title, marginX, startY);
  const tableStartY = startY + 4;

  const columns = [{ header: "PBI", dataKey: "id" }, ...(showWiseColumn ? [{ header: "WQ/SDR", dataKey: "wise" }] : []), { header: "Description", dataKey: "description" }, { header: "Size", dataKey: "size" }];

  const body = workItems.map(x => {
    const { bgColor, isBold } = getRowStyles(x, sprintStartDate);
    return {
      id: String(x.id),
      wise: includeDoneWiseColumn ? (x.wiseNumber ?? "") : "",
      description: cleanTextForPdf(x.title),
      size: String(x.effort ?? ""),
      meta: {
        idLink: `${context.origin}/${context.collection}/${context.project}/_workitems/edit/${x.id}`,
        wiseLink: x.wiseLink,
        bgColor,
        isBold
      }
    };
    // biome-ignore lint/suspicious/noExplicitAny: nested metadata is not compatible with autoTable type definitions
  }) as any[];

  autoTable(doc, {
    columns,
    body,
    startY: tableStartY,
    theme: "grid",
    styles: {
      lineColor: "#cbd5e1", // Slate 300
      lineWidth: 0.1,
      fontSize: 9,
      valign: "middle"
    },
    headStyles: {
      fillColor: "#1e293b", // Slate 800
      textColor: "#ffffff",
      fontSize: 9.5,
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      id: { cellWidth: 30, halign: "center" },
      ...(showWiseColumn ? { wise: { cellWidth: 25, halign: "center" } } : {}),
      description: { cellWidth: "auto", halign: "left" },
      size: { cellWidth: 20, halign: "center" }
    },
    didParseCell: data => {
      if (data.section === "body") {
        // biome-ignore lint/suspicious/noExplicitAny: row raw is typed as unknown
        const rowRaw = data.row.raw as any;
        if (rowRaw?.meta) {
          const { bgColor, isBold } = rowRaw.meta;
          if (bgColor) {
            data.cell.styles.fillColor = bgColor;
          }
          if (isBold) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
    didDrawCell: data => {
      if (data.section === "body") {
        // biome-ignore lint/suspicious/noExplicitAny: row raw is typed as unknown
        const rowRaw = data.row.raw as any;
        if (rowRaw?.meta) {
          const cellKey = data.column.dataKey as string;
          let url: string | undefined;
          if (cellKey === "id") {
            url = rowRaw.meta.idLink;
          } else if (cellKey === "wise") {
            url = rowRaw.meta.wiseLink;
          }
          if (url) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
          }
        }
      }
    }
  });

  // biome-ignore lint/suspicious/noExplicitAny: lastAutoTable is added dynamically by the plugin
  return (doc as any).lastAutoTable.finalY + 12; // spacing after table
}

function renderTeamContent(doc: jsPDF, teamName: string, workItems: WorkItem[], context: PdfReportContext, sprintStartDate?: Date, backgroundColor?: string): void {
  const workItemCollection = new WorkItemCollection(workItems, sprintStartDate);
  const commitment = workItemCollection.commitmentPercentage;
  const showWiseColumn = workItems.some(x => x.wiseNumber !== undefined);

  // Draw team header banner
  let currentY = drawTeamHeaderBanner(doc, teamName, context.sprint, commitment, backgroundColor);

  // Render sections
  currentY = addWorkItemSection(doc, "Completed", workItemCollection.done, context, true, showWiseColumn, sprintStartDate, currentY);
  currentY = addWorkItemSection(doc, "In Progress", workItemCollection.inProgress, context, false, showWiseColumn, sprintStartDate, currentY);
  currentY = addWorkItemSection(doc, "Not Started", workItemCollection.notStarted, context, false, showWiseColumn, sprintStartDate, currentY);
  currentY = addWorkItemSection(doc, "Removed", workItemCollection.removed, context, false, showWiseColumn, sprintStartDate, currentY);

  if (workItemCollection.studyTime.length > 0) {
    currentY = addWorkItemSection(doc, "Study Time", workItemCollection.studyTime, context, true, showWiseColumn, sprintStartDate, currentY);
  }
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Draw footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#64748b"); // Slate 500

    // Generation timestamp (local date string)
    const timestampStr = `Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    doc.text(timestampStr, 14, height - 8);

    // Page numbering
    const pageStr = `Page ${i} of ${pageCount}`;
    doc.text(pageStr, width - 14, height - 8, { align: "right" });
  }
}

export function generatePdfReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[], sprintStartDate?: Date) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const context: PdfReportContext = { origin, collection, project, sprint };

  renderTeamContent(doc, team, workItems, context, sprintStartDate);
  addPageNumbers(doc);

  const pdfOutput = doc.output("arraybuffer");
  saveFile(new Uint8Array(pdfOutput), `${team} - ${sprint}.pdf`, "application/pdf");
}

export function generateMultiTeamPdfReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, sprint: string, teamWorkItems: TeamWorkItems[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const context: PdfReportContext = { origin, collection, project, sprint };

  teamWorkItems.forEach((teamData, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderTeamContent(doc, teamData.team, teamData.workItems, context, teamData.sprintStartDate, teamData.backgroundColor);
  });

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  addPageNumbers(doc);

  const pdfOutput = doc.output("arraybuffer");
  saveFile(new Uint8Array(pdfOutput), `Multi-Team (${teamNames}) - ${sprint}.pdf`, "application/pdf");
}
