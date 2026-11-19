import type { AzureDevOpsIteration } from "../api/schemas";
import type { WorkItem } from "./WorkItem";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Snapshot at the end of Day 2 of the sprint (start + 1 day, 23:59:59.999 UTC).
 * Work committed at this point is the baseline for the Say-Do Ratio.
 */
export function getCommitSnapshotDate(sprintStart: Date): Date {
  const date = new Date(sprintStart.getTime() + DAY_MS);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

/**
 * Snapshot at the end of the day before the sprint finishes (finish - 1 day, 23:59:59.999 UTC).
 * For a sprint still in progress, the current time is used instead.
 */
export function getFinalSnapshotDate(sprintFinish: Date, now: Date = new Date()): Date {
  const endOfSnapshotDay = new Date(sprintFinish.getTime() - DAY_MS);
  endOfSnapshotDay.setUTCHours(23, 59, 59, 999);
  return now < endOfSnapshotDay ? now : endOfSnapshotDay;
}

export interface SayDoResult {
  committedPoints: number;
  completedCommittedPoints: number;
  completedCommittedCount: number;
  /** Rounded percentage, or null when nothing was committed. */
  percent: number | null;
}

/**
 * Say-Do Ratio: points of work committed at the start snapshot that are Done at the final snapshot,
 * divided by the committed points. Items removed from the sprint are ignored in both snapshots' totals,
 * so an item removed after commitment still counts toward the committed total but cannot be completed.
 * Items added after the commitment snapshot never count.
 */
export function calculateSayDo(initialItems: WorkItem[], finalItems: WorkItem[]): SayDoResult {
  const initialActive = initialItems.filter(w => !w.isRemoved);
  const committedIds = new Set(initialActive.map(w => w.id));
  const committedPoints = initialActive.reduce((sum, w) => sum + (w.effort || 0), 0);

  const completedCommitted = finalItems.filter(w => !w.isRemoved && w.isDone && committedIds.has(w.id));
  const completedCommittedPoints = completedCommitted.reduce((sum, w) => sum + (w.effort || 0), 0);

  return {
    committedPoints,
    completedCommittedPoints,
    completedCommittedCount: completedCommitted.length,
    percent: committedPoints > 0 ? Math.round((completedCommittedPoints / committedPoints) * 100) : null
  };
}

export interface TrendSprint {
  name: string;
  /** Iteration path with the project prefix removed, as the snapshot API expects. */
  path: string;
  startDate: Date;
  finishDate: Date;
}

/**
 * Picks up to `count` sprints ending with the selected sprint, in chronological order.
 * Sprints without dates, or that have not started yet, are skipped.
 */
export function selectTrendSprints(iterations: AzureDevOpsIteration[], selected: { name: string; path: string }, project: string, count: number, now: Date = new Date()): TrendSprint[] {
  const dated: TrendSprint[] = [];
  for (const iteration of iterations) {
    const start = iteration.attributes?.startDate;
    const finish = iteration.attributes?.finishDate;
    if (!start || !finish) continue;
    const startDate = new Date(start);
    if (startDate > now) continue;
    dated.push({ name: iteration.name, path: normalizeIterationPath(iteration.path, project), startDate, finishDate: new Date(finish) });
  }
  dated.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const selectedPath = normalizeIterationPath(selected.path, project);
  let index = dated.findIndex(s => s.path.toLowerCase() === selectedPath.toLowerCase());
  if (index === -1) index = dated.findIndex(s => s.name === selected.name);
  if (index === -1) return [];

  return dated.slice(Math.max(0, index - count + 1), index + 1);
}

export function normalizeIterationPath(path: string, project: string): string {
  let p = path.replace(/\//g, "\\");
  const prefix = `${project}\\`.toLowerCase();
  if (p.toLowerCase().startsWith(prefix)) {
    p = p.slice(prefix.length);
  }
  return p;
}
