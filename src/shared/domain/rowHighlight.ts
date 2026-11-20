import type { WorkItem } from "./WorkItem";

/**
 * Highlight categories for work item rows. Used by the work item table, its colour key,
 * and the Excel and PDF reports, so they always agree.
 */
export type RowHighlight = "pulledIn" | "hotfix" | "carriedOver";

export interface RowHighlightStyle {
  label: string;
  /** Light-mode background as #rrggbb. Excel uses the same colour without the #. */
  color: string;
  /** Dark-mode background, used in the work item table. */
  darkColor: string;
}

export const ROW_HIGHLIGHT_STYLES: Record<RowHighlight, RowHighlightStyle> = {
  pulledIn: { label: "Pulled in after sprint start", color: "#fff176", darkColor: "rgba(255, 235, 59, 0.35)" },
  hotfix: { label: "Hotfix / critical bug (! tag)", color: "#ffa726", darkColor: "rgba(255, 152, 0, 0.45)" },
  carriedOver: { label: "Carried over from a previous sprint", color: "#f4a1a1", darkColor: "rgba(244, 67, 54, 0.35)" }
};

/** Order in which the key lists the categories. */
export const ROW_HIGHLIGHT_ORDER: RowHighlight[] = ["pulledIn", "hotfix", "carriedOver"];

/**
 * Returns the highlight for a work item, or null when it should not be highlighted.
 * A sprint tag takes precedence over dates, and dates are only used when no tag applies.
 */
export function getRowHighlight(workItem: WorkItem, sprintStartDate?: Date): RowHighlight | null {
  if (workItem.sprint?.sprintNumber && workItem.sprintTag?.sprintNumber) {
    const isCurrentSprint = workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber;
    const isPreviousSprint = workItem.sprintTag.sprintNumber === workItem.sprint.sprintNumber - 1;
    const suffix = workItem.sprintTag.sprintSuffix;

    if (isCurrentSprint && suffix === "+") return "pulledIn";
    if (isCurrentSprint && suffix === "!") return "hotfix";
    if (isPreviousSprint && suffix !== "+") return "carriedOver";
  }

  if (sprintStartDate) {
    // Activated more than 2 days after sprint start
    if (workItem.isPulledInLate(sprintStartDate)) return "pulledIn";
    // Activated more than 2 days before sprint start
    if (workItem.isActivatedEarly(sprintStartDate)) return "carriedOver";
  }

  return null;
}
