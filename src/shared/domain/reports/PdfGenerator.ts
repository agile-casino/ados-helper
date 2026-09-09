import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toPlainText } from "../../utils/toPlainText";
import type { WorkItem } from "../WorkItem";
import { WorkItemCollection } from "../WorkItemCollection";
import { AC_BULLET_LINE, DEFAULT_BANNER_COLOR, DIVIDER_COLOR, darkenHex, formatSectionTitle, REPORT_SECTIONS, type ReportSectionTheme, SLATE_400, SLATE_500, SLATE_700, SLATE_800, SLATE_900 } from "./reportTheme";
import { getWorkItemTypePrefix } from "./workItemType";

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

function drawTeamHeaderBanner(doc: jsPDF, teamName: string, sprintName: string, commitment: number, bgColorHex?: string, showCommitment = true) {
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
  if (showCommitment) {
    doc.text(`${commitment}% Commitment`, width - marginX - 4, startY + 11, { align: "right" });
  }

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

const AC_MARGIN_X = 14;
const AC_TOP_MARGIN = 20;
const AC_BOTTOM_MARGIN = 20;
const AC_HEADING_LINE_HEIGHT = 6;
const AC_CONTENT_LINE_HEIGHT = 4.8;
const AC_BULLET_INDENT = 4;
const AC_BANNER_HEIGHT = 16;
const AC_KEEP_LINES = 2;
const AC_EMPTY_STATE_TEXT = "No work items found for this sprint.";

interface AcPageContext {
  teamName: string;
  sprintName: string;
  backgroundColor?: string | undefined;
  hasBannerDrawn: boolean;
}

function drawAcceptanceCriteriaBanner(doc: jsPDF, teamName: string, sprintName: string, backgroundColor?: string): number {
  const width = doc.internal.pageSize.getWidth();
  const marginX = AC_MARGIN_X;
  const startY = 16;

  const fillCol = backgroundColor || `#${DEFAULT_BANNER_COLOR}`;
  doc.setFillColor(fillCol);
  doc.rect(marginX, startY, width - marginX * 2, AC_BANNER_HEIGHT, "F");
  doc.setFillColor(darkenHex(fillCol, 0.55));
  doc.rect(marginX, startY, 2.2, AC_BANNER_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(SLATE_800);
  doc.text(cleanTextForPdf(`${teamName} - ${sprintName}`), marginX + 5, startY + 11);

  return startY + AC_BANNER_HEIGHT + 9;
}

function drawAcceptanceCriteriaRunningHeader(doc: jsPDF, teamName: string, sprintName: string, backgroundColor?: string): void {
  const width = doc.internal.pageSize.getWidth();
  const marginX = AC_MARGIN_X;
  const bannerHeight = 8;
  const startY = 14;

  const fillCol = backgroundColor || `#${DEFAULT_BANNER_COLOR}`;
  doc.setFillColor(fillCol);
  doc.rect(marginX, startY, width - marginX * 2, bannerHeight, "F");
  doc.setFillColor(darkenHex(fillCol, 0.55));
  doc.rect(marginX, startY, 2.2, bannerHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(SLATE_800);
  doc.text(cleanTextForPdf(`${teamName} - ${sprintName} (continued)`), marginX + 5, startY + 6);
}

function addAcceptanceCriteriaPage(doc: jsPDF, pageContext: AcPageContext): number {
  doc.addPage();
  if (pageContext.hasBannerDrawn) {
    drawAcceptanceCriteriaRunningHeader(doc, pageContext.teamName, pageContext.sprintName, pageContext.backgroundColor);
    return AC_TOP_MARGIN + 8;
  }
  return drawAcceptanceCriteriaBanner(doc, pageContext.teamName, pageContext.sprintName, pageContext.backgroundColor);
}

function drawCriteriaLines(doc: jsPDF, lines: string[], startY: number, pageContext: AcPageContext): number {
  const contentWidth = doc.internal.pageSize.getWidth() - AC_MARGIN_X * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = startY;

  for (const line of lines) {
    const bulletMatch = AC_BULLET_LINE.exec(line);
    if (bulletMatch) {
      const contentLines = doc.splitTextToSize(bulletMatch[1] ?? "", contentWidth - AC_BULLET_INDENT) as string[];
      for (const [index, contentLine] of contentLines.entries()) {
        if (currentY > pageHeight - AC_BOTTOM_MARGIN) {
          currentY = addAcceptanceCriteriaPage(doc, pageContext);
        }
        if (index === 0) {
          doc.text("•", AC_MARGIN_X + 0.8, currentY);
        }
        doc.text(contentLine, AC_MARGIN_X + AC_BULLET_INDENT, currentY);
        currentY += AC_CONTENT_LINE_HEIGHT;
      }
    } else {
      const contentLines = doc.splitTextToSize(line, contentWidth) as string[];
      for (const contentLine of contentLines) {
        if (currentY > pageHeight - AC_BOTTOM_MARGIN) {
          currentY = addAcceptanceCriteriaPage(doc, pageContext);
        }
        doc.text(contentLine, AC_MARGIN_X, currentY);
        currentY += AC_CONTENT_LINE_HEIGHT;
      }
    }
  }

  return currentY;
}

function addAcceptanceCriteriaItem(doc: jsPDF, workItem: WorkItem, context: PdfReportContext, startY: number, pageContext: AcPageContext): number {
  const contentWidth = doc.internal.pageSize.getWidth() - AC_MARGIN_X * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = startY;

  // Heading: "<Type_Prefix> <PBI_Number>" followed by the title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  if (currentY > pageHeight - AC_BOTTOM_MARGIN - AC_HEADING_LINE_HEIGHT - AC_KEEP_LINES * AC_CONTENT_LINE_HEIGHT) {
    currentY = addAcceptanceCriteriaPage(doc, pageContext);
  }
  doc.setTextColor(SLATE_500);
  const typePrefix = getWorkItemTypePrefix(workItem.workItemType);
  const idText = cleanTextForPdf(`${typePrefix} ${workItem.id}`);
  doc.text(idText, AC_MARGIN_X, currentY);

  const titleX = AC_MARGIN_X + doc.getTextWidth(idText) + 1.8;
  doc.setTextColor(SLATE_900);
  const titleLines = doc.splitTextToSize(cleanTextForPdf(workItem.title), contentWidth - (titleX - AC_MARGIN_X)) as string[];
  for (const line of titleLines) {
    if (currentY > pageHeight - AC_BOTTOM_MARGIN) {
      currentY = addAcceptanceCriteriaPage(doc, pageContext);
    }
    doc.text(line, titleX, currentY);
    doc.link(AC_MARGIN_X, currentY - 4.5, contentWidth, AC_HEADING_LINE_HEIGHT, {
      url: `${context.origin}/${context.collection}/${context.project}/_workitems/edit/${workItem.id}`
    });
    currentY += AC_HEADING_LINE_HEIGHT;
  }

  // Acceptance criteria content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const criteriaText = cleanTextForPdf(toPlainText(workItem.acceptanceCriteria));
  if (!criteriaText) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(SLATE_400);
    currentY += 1;
    doc.text("No acceptance criteria defined.", AC_MARGIN_X, currentY);
    return currentY + AC_CONTENT_LINE_HEIGHT + 6;
  }

  doc.setTextColor(SLATE_700);
  currentY = drawCriteriaLines(doc, criteriaText.split("\n"), currentY + 1, pageContext);
  return currentY + 6;
}

function addAcceptanceCriteriaSection(doc: jsPDF, section: ReportSectionTheme, workItems: WorkItem[], context: PdfReportContext, startY: number, pageContext: AcPageContext): number {
  if (workItems.length === 0) return startY;

  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = doc.internal.pageSize.getWidth() - AC_MARGIN_X * 2;
  let currentY = startY;

  if (currentY > pageHeight - AC_BOTTOM_MARGIN - AC_HEADING_LINE_HEIGHT - AC_KEEP_LINES * AC_CONTENT_LINE_HEIGHT) {
    currentY = addAcceptanceCriteriaPage(doc, pageContext);
  }

  const title = formatSectionTitle(section, workItems.length);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(section.accent);
  doc.text(title, AC_MARGIN_X, currentY);

  const ruleWidth = Math.min(doc.getTextWidth(title) + 2, contentWidth);
  doc.setDrawColor(section.accent);
  doc.setLineWidth(0.7);
  doc.line(AC_MARGIN_X, currentY + 2.2, AC_MARGIN_X + ruleWidth, currentY + 2.2);
  currentY += AC_HEADING_LINE_HEIGHT + 3.5;

  for (const [index, workItem] of workItems.entries()) {
    currentY = addAcceptanceCriteriaItem(doc, workItem, context, currentY, pageContext);
    if (index < workItems.length - 1) {
      if (currentY > pageHeight - AC_BOTTOM_MARGIN - 4) {
        currentY = addAcceptanceCriteriaPage(doc, pageContext);
      }
      doc.setDrawColor(DIVIDER_COLOR);
      doc.setLineWidth(0.2);
      doc.line(AC_MARGIN_X, currentY + 1, AC_MARGIN_X + contentWidth, currentY + 1);
      currentY += 5;
    }
  }

  return currentY;
}

function renderAcceptanceCriteriaContent(doc: jsPDF, teamName: string, workItems: WorkItem[], context: PdfReportContext, backgroundColor?: string): void {
  const pageContext: AcPageContext = { teamName, sprintName: context.sprint, backgroundColor, hasBannerDrawn: false };
  let currentY = drawAcceptanceCriteriaBanner(doc, teamName, context.sprint, backgroundColor);
  pageContext.hasBannerDrawn = true;

  const workItemCollection = new WorkItemCollection(workItems);
  const isEmpty = workItemCollection.done.length === 0 && workItemCollection.inProgress.length === 0 && workItemCollection.notStarted.length === 0 && workItemCollection.removed.length === 0 && workItemCollection.studyTime.length === 0;

  if (isEmpty) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(SLATE_400);
    currentY += 4;
    doc.text(AC_EMPTY_STATE_TEXT, AC_MARGIN_X, currentY);
    return;
  }

  currentY = addAcceptanceCriteriaSection(doc, REPORT_SECTIONS.completed, workItemCollection.done, context, currentY, pageContext);
  currentY = addAcceptanceCriteriaSection(doc, REPORT_SECTIONS.inProgress, workItemCollection.inProgress, context, currentY, pageContext);
  currentY = addAcceptanceCriteriaSection(doc, REPORT_SECTIONS.notStarted, workItemCollection.notStarted, context, currentY, pageContext);
  currentY = addAcceptanceCriteriaSection(doc, REPORT_SECTIONS.removed, workItemCollection.removed, context, currentY, pageContext);

  if (workItemCollection.studyTime.length > 0) {
    addAcceptanceCriteriaSection(doc, REPORT_SECTIONS.studyTime, workItemCollection.studyTime, context, currentY, pageContext);
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
    doc.setTextColor(SLATE_500);

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

export function generateAcceptanceCriteriaReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, team: string, sprint: string, workItems: WorkItem[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const context: PdfReportContext = { origin, collection, project, sprint };

  renderAcceptanceCriteriaContent(doc, team, workItems, context);
  doc.setProperties({ title: `${team} - ${sprint} - Acceptance Criteria`, subject: "Acceptance Criteria" });
  addPageNumbers(doc);

  const pdfOutput = doc.output("arraybuffer");
  saveFile(new Uint8Array(pdfOutput), `${team} - ${sprint} - Acceptance Criteria.pdf`, "application/pdf");
}

export function generateMultiTeamAcceptanceCriteriaReport(saveFile: (data: Uint8Array, filename: string, mimeType: string) => Promise<void>, origin: string, collection: string, project: string, sprint: string, teamWorkItems: TeamWorkItems[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const context: PdfReportContext = { origin, collection, project, sprint };

  teamWorkItems.forEach((teamData, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderAcceptanceCriteriaContent(doc, teamData.team, teamData.workItems, context, teamData.backgroundColor);
  });

  const teamNames = teamWorkItems.map(t => t.team).join(", ");
  doc.setProperties({ title: `Multi-Team (${teamNames}) - ${sprint} - Acceptance Criteria`, subject: "Acceptance Criteria" });
  addPageNumbers(doc);

  const pdfOutput = doc.output("arraybuffer");
  saveFile(new Uint8Array(pdfOutput), `Multi-Team (${teamNames}) - ${sprint} - Acceptance Criteria.pdf`, "application/pdf");
}
