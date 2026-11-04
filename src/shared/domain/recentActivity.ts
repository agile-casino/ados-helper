import type { WorkItemUpdate } from "../api/schemas";
import { parseAzureDate } from "../utils/parseAzureDate";
import type { WorkItem } from "./WorkItem";
import { categorizeState, type WorkItemStateConfig } from "./WorkItemState";

export type ActivityTone = "positive" | "negative" | "neutral";

interface ActivityLine {
  text: string;
  tone: ActivityTone;
}

interface TaskActivity {
  id: number;
  title: string;
  assignedTo: string | null;
  /** What happened to this task, e.g. "Added · 4h", "Completed", "Remaining 2h → 5h". */
  events: ActivityLine[];
  lastActivity: Date;
}

export interface PbiActivity {
  id: number;
  title: string;
  workItemType: string;
  lines: ActivityLine[];
  /** Per-task detail behind the "N tasks …" summary lines, most recent first. */
  tasks: TaskActivity[];
  /** The most recent change (PBI or any of its tasks) inside the window. */
  lastActivity: Date;
}

export type UpdatesById = Record<number, WorkItemUpdate[]>;

const SCHEDULING = "Microsoft.VSTS.Scheduling";

const plural = (n: number, singular: string) => `${n} ${singular}${n === 1 ? "" : "s"}`;

const formatHours = (hours: number) => `${hours > 0 ? "+" : "−"}${Math.round(Math.abs(hours) * 100) / 100}h`;

/**
 * When an update happened. The newest revision of a work item has not been
 * superseded, so its `revisedDate` can be a far-future sentinel (e.g. 9999-01-01)
 * that parses to null. Fall back to the update's own System.ChangedDate, then to
 * the item's current ChangedDate (which, for the newest revision, is that edit).
 */
const resolveUpdateTime = (update: WorkItemUpdate, isNewest: boolean, itemChangedDate: Date | null): Date | null => {
  const revised = parseAzureDate(update.revisedDate);
  if (revised) return revised;
  const fieldChanged = parseAzureDate(update.fields?.["System.ChangedDate"]?.newValue ?? undefined);
  if (fieldChanged) return fieldChanged;
  return isNewest ? itemChangedDate : null;
};

/** Updates inside the window, oldest first, paired with their resolved timestamp. */
const windowed = (updates: WorkItemUpdate[] | undefined, since: Date, until: Date, itemChangedDate: Date | null = null) => {
  const newestRev = Math.max(...(updates ?? []).map(u => u.rev), 0);
  return (updates ?? [])
    .map(update => ({ update, at: resolveUpdateTime(update, update.rev === newestRev, itemChangedDate) }))
    .filter((x): x is { update: WorkItemUpdate; at: Date } => x.at !== null && x.at >= since && x.at <= until)
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.update.rev - b.update.rev);
};

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

const formatPlainHours = (hours: number) => `${Math.round(hours * 100) / 100}h`;

/** First old / last new value of a numeric field across the window, or null when nothing changed net. */
const netNumericChange = (entries: ReturnType<typeof windowed>, field: "RemainingWork" | "CompletedWork"): { from: number | null; to: number | null } | null => {
  let from: number | null | undefined;
  let to: number | null | undefined;
  for (const { update } of entries) {
    const change = update.fields?.[`${SCHEDULING}.${field}`];
    if (!change) continue;
    if (from === undefined) from = change.oldValue ?? null;
    to = change.newValue ?? null;
  }
  if (to === undefined || from === to) return null;
  return { from: from ?? null, to };
};

const describeTask = (task: { id: number; title: string; assignedTo: string | null; currentRemaining: number | undefined }, entries: ReturnType<typeof windowed>, config: WorkItemStateConfig): TaskActivity | null => {
  const events: ActivityLine[] = [];
  const creation = entries.find(e => e.update.rev === 1);
  const afterCreation = entries.filter(e => e !== creation);

  // Tasks are often created with just a title and estimated in the next edit, so
  // the starting hours are the first estimate set in the window, not only rev 1's.
  const estimateIndex = creation ? entries.findIndex(e => e.update.fields?.[`${SCHEDULING}.RemainingWork`]?.newValue != null) : -1;
  const estimate = estimateIndex >= 0 ? entries[estimateIndex]?.update.fields?.[`${SCHEDULING}.RemainingWork`]?.newValue : null;
  // Hour changes are reported relative to that starting estimate.
  const afterEstimate = estimateIndex >= 0 ? entries.slice(estimateIndex + 1) : afterCreation;

  if (creation) {
    if (estimate) events.push({ text: `Added · ${formatPlainHours(estimate)}`, tone: "neutral" });
    // The history shows no estimate, but the task has hours today: report what we can see rather than claim none were set.
    else if (task.currentRemaining) events.push({ text: `Added · now ${formatPlainHours(task.currentRemaining)}`, tone: "neutral" });
    else events.push({ text: "Added · no hours set", tone: "negative" });
  }

  const stateChange = netStateChange(entries);
  if (stateChange) {
    const fromCategory = stateChange.from ? categorizeState(stateChange.from, config) : null;
    const toCategory = categorizeState(stateChange.to, config);
    if (toCategory === "Done" && fromCategory !== "Done") events.push({ text: "Completed", tone: "positive" });
    else if (toCategory === "Removed" && fromCategory !== "Removed") events.push({ text: "Removed", tone: "negative" });
    else if (fromCategory === "Done" && toCategory !== "Done") events.push({ text: "Reopened", tone: "negative" });
    else if (stateChange.from === "To Do" && toCategory !== "Done" && toCategory !== "Removed") events.push({ text: "Started", tone: "positive" });
  }

  const remaining = netNumericChange(afterEstimate, "RemainingWork");
  if (remaining) {
    const from = remaining.from ?? 0;
    const to = remaining.to ?? 0;
    events.push({ text: `Remaining ${formatPlainHours(from)} → ${formatPlainHours(to)}`, tone: to > from ? "negative" : "positive" });
  }
  const logged = numericDelta(afterCreation, "CompletedWork");
  if (logged !== 0) events.push({ text: `Logged ${formatHours(logged)}`, tone: "neutral" });

  if (events.length === 0) return null;
  return { ...task, events, lastActivity: new Date(Math.max(...entries.map(e => e.at.getTime()))) };
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
    const pbiEntries = windowed(updatesById[item.id], since, until, item.changedDate);
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
    const taskActivities: TaskActivity[] = [];
    let remainingDelta = numericDelta(pbiEntries, "RemainingWork");
    let loggedDelta = numericDelta(pbiEntries, "CompletedWork");

    for (const task of item.allTasks) {
      const taskEntries = windowed(updatesById[task.System.Id], since, until, parseAzureDate(task.System.ChangedDate));
      if (taskEntries.length === 0) continue;
      taskEntries.forEach(e => {
        timestamps.push(e.at.getTime());
      });

      if (taskEntries.some(e => e.update.rev === 1)) tasksAdded++;

      const detail = describeTask({ id: task.System.Id, title: task.System.Title, assignedTo: task.System.AssignedTo, currentRemaining: task.Microsoft.VSTS.Scheduling.RemainingWork }, taskEntries, config);
      if (detail) taskActivities.push(detail);

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

    if (lines.length === 0 && taskActivities.length === 0) continue;

    result.push({
      id: item.id,
      title: item.title,
      workItemType: item.workItemType,
      lines,
      tasks: taskActivities.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
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
