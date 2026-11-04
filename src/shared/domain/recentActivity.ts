import type { WorkItemUpdate } from "../api/schemas";
import { parseAzureDate } from "../utils/parseAzureDate";
import type { WorkItem } from "./WorkItem";
import { categorizeState, type WorkItemStateConfig } from "./WorkItemState";

export type ActivityTone = "positive" | "negative" | "neutral";

interface ActivityLine {
  text: string;
  tone: ActivityTone;
}

export interface PbiActivity {
  id: number;
  title: string;
  workItemType: string;
  lines: ActivityLine[];
  /** The most recent change (PBI or any of its tasks) inside the window. */
  lastActivity: Date;
}

export type UpdatesById = Record<number, WorkItemUpdate[]>;

const SCHEDULING = "Microsoft.VSTS.Scheduling";

const plural = (n: number, singular: string) => `${n} ${singular}${n === 1 ? "" : "s"}`;

const formatHours = (hours: number) => `${hours > 0 ? "+" : "−"}${Math.round(Math.abs(hours) * 100) / 100}h`;

const inWindow = (update: WorkItemUpdate, since: Date, until: Date): Date | null => {
  const at = parseAzureDate(update.revisedDate);
  return at && at >= since && at <= until ? at : null;
};

/** Updates inside the window, oldest first, paired with their parsed timestamp. */
const windowed = (updates: WorkItemUpdate[] | undefined, since: Date, until: Date) =>
  (updates ?? [])
    .map(update => ({ update, at: inWindow(update, since, until) }))
    .filter((x): x is { update: WorkItemUpdate; at: Date } => x.at !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

/** Sum of (new − old) for a numeric field across the window. An unset old value counts as 0. */
const numericDelta = (entries: ReturnType<typeof windowed>, field: "RemainingWork" | "CompletedWork"): number => {
  let delta = 0;
  for (const { update } of entries) {
    const change = update.fields?.[`${SCHEDULING}.${field}`];
    if (change) delta += (change.newValue ?? 0) - (change.oldValue ?? 0);
  }
  return delta;
};

/** First old / last new value of a field across the window, or null when nothing changed net. */
const netStateChange = (entries: ReturnType<typeof windowed>): { from: string | null; to: string } | null => {
  let from: string | null | undefined;
  let to: string | null | undefined;
  for (const { update } of entries) {
    const change = update.fields?.["System.State"];
    if (!change) continue;
    if (from === undefined) from = change.oldValue ?? null;
    to = change.newValue ?? to;
  }
  if (to == null || from === to) return null;
  return { from: from ?? null, to };
};

const describePbiState = (change: { from: string | null; to: string }, config: WorkItemStateConfig): ActivityLine => {
  const fromCategory = change.from ? categorizeState(change.from, config) : null;
  const toCategory = categorizeState(change.to, config);
  const detail = change.from ? `${change.from} → ${change.to}` : change.to;
  if (toCategory === "Done" && fromCategory !== "Done") return { text: `Completed (${detail})`, tone: "positive" };
  if (toCategory === "Removed" && fromCategory !== "Removed") return { text: `Removed (${detail})`, tone: "negative" };
  if (fromCategory === "Done" && toCategory !== "Done") return { text: `Reopened (${detail})`, tone: "negative" };
  if (fromCategory === "Removed" && toCategory !== "Removed") return { text: `Restored (${detail})`, tone: "neutral" };
  if (fromCategory === "Not Started" && toCategory === "In Progress") return { text: `Started (${detail})`, tone: "positive" };
  return { text: `State: ${detail}`, tone: "neutral" };
};

/**
 * Summarizes what changed on each sprint PBI (and its tasks) in [since, until].
 *
 * `updatesById` is keyed by work item id for the PBI and every task. Items with
 * no activity in the window are omitted; the result is newest activity first.
 */
export function buildRecentActivity(items: WorkItem[], updatesById: UpdatesById, since: Date, until: Date, config: WorkItemStateConfig): PbiActivity[] {
  const result: PbiActivity[] = [];

  for (const item of items) {
    const lines: ActivityLine[] = [];
    const timestamps: number[] = [];
    const pbiEntries = windowed(updatesById[item.id], since, until);
    pbiEntries.forEach(e => {
      timestamps.push(e.at.getTime());
    });

    // PBI state
    const pbiState = netStateChange(pbiEntries);
    if (pbiState) lines.push(describePbiState(pbiState, config));

    // PBI effort
    let effortFrom: number | null | undefined;
    let effortTo: number | null | undefined;
    for (const { update } of pbiEntries) {
      const change = update.fields?.[`${SCHEDULING}.Effort`];
      if (!change) continue;
      if (effortFrom === undefined) effortFrom = change.oldValue ?? null;
      effortTo = change.newValue ?? null;
    }
    if (effortTo !== undefined && effortFrom !== effortTo) {
      lines.push({ text: `Effort: ${effortFrom ?? "unset"} → ${effortTo ?? "unset"}`, tone: "neutral" });
    }

    // PBI iteration
    for (const { update } of pbiEntries) {
      const iteration = update.fields?.["System.IterationPath"];
      if (iteration?.oldValue && iteration.newValue && iteration.oldValue !== iteration.newValue) {
        lines.push({ text: `Moved to ${iteration.newValue.split("\\").pop()}`, tone: "neutral" });
      }
    }

    // Tasks
    let tasksAdded = 0;
    let tasksCompleted = 0;
    let tasksStarted = 0;
    let tasksRemoved = 0;
    let tasksReopened = 0;
    let remainingDelta = numericDelta(pbiEntries, "RemainingWork");
    let loggedDelta = numericDelta(pbiEntries, "CompletedWork");

    for (const task of item.allTasks) {
      const taskEntries = windowed(updatesById[task.System.Id], since, until);
      if (taskEntries.length === 0) continue;
      taskEntries.forEach(e => {
        timestamps.push(e.at.getTime());
      });

      if (taskEntries.some(e => e.update.rev === 1)) tasksAdded++;

      const change = netStateChange(taskEntries);
      if (change) {
        const fromCategory = change.from ? categorizeState(change.from, config) : null;
        const toCategory = categorizeState(change.to, config);
        if (toCategory === "Done" && fromCategory !== "Done") tasksCompleted++;
        else if (toCategory === "Removed" && fromCategory !== "Removed") tasksRemoved++;
        else if (fromCategory === "Done" && toCategory !== "Done") tasksReopened++;
        else if (change.from === "To Do" && toCategory !== "Done" && toCategory !== "Removed") tasksStarted++;
      }

      remainingDelta += numericDelta(taskEntries, "RemainingWork");
      loggedDelta += numericDelta(taskEntries, "CompletedWork");
    }

    if (tasksCompleted) lines.push({ text: `${plural(tasksCompleted, "task")} completed`, tone: "positive" });
    if (tasksStarted) lines.push({ text: `${plural(tasksStarted, "task")} started`, tone: "positive" });
    if (tasksAdded) lines.push({ text: `${plural(tasksAdded, "task")} added`, tone: "neutral" });
    if (tasksRemoved) lines.push({ text: `${plural(tasksRemoved, "task")} removed`, tone: "neutral" });
    if (tasksReopened) lines.push({ text: `${plural(tasksReopened, "task")} reopened`, tone: "negative" });
    if (loggedDelta !== 0) lines.push({ text: `Hours logged: ${formatHours(loggedDelta)}`, tone: "neutral" });
    // More remaining work than before is a scope signal, so it reads as negative.
    if (remainingDelta !== 0) lines.push({ text: `Remaining work: ${formatHours(remainingDelta)}`, tone: remainingDelta > 0 ? "negative" : "positive" });

    if (lines.length === 0) continue;

    result.push({
      id: item.id,
      title: item.title,
      workItemType: item.workItemType,
      lines,
      lastActivity: new Date(Math.max(...timestamps))
    });
  }

  return result.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
}

/** Ids whose updates are worth fetching: the PBI and its tasks, skipping any known unchanged since `since`. */
export function collectIdsToFetch(items: WorkItem[], since: Date): number[] {
  const ids = new Set<number>();
  for (const item of items) {
    const changed = item.changedDate;
    if (!changed || changed >= since) ids.add(item.id);
    for (const task of item.allTasks) {
      const taskChanged = parseAzureDate(task.System.ChangedDate);
      if (!taskChanged || taskChanged >= since) ids.add(task.System.Id);
    }
  }
  return [...ids];
}
