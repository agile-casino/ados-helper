import { describe, expect, test } from "vitest";
import type { WorkItemUpdate } from "../api/schemas";
import type { WorkItemDto } from "../api/WorkItemDto";
import { buildRecentActivity, collectIdsToFetch } from "./recentActivity";
import { WorkItem } from "./WorkItem";
import { DEFAULT_WORK_ITEM_STATE_CONFIG } from "./WorkItemState";

const until = new Date("2026-06-10T12:00:00Z");
const since = new Date("2026-06-09T12:00:00Z");
const inside = "2026-06-10T08:00:00Z";
const outside = "2026-06-08T08:00:00Z";

function dto(id: number, type: string, state: string, children: WorkItemDto[] = [], changedDate?: string): WorkItemDto {
  return {
    Microsoft: { VSTS: { Scheduling: { Effort: 3 } } },
    System: { Id: id, WorkItemType: type, TeamProject: "p", Rev: 1, Tags: "", State: state, AssignedTo: null, Title: `Item ${id}`, IterationPath: "p\\Sprint 1", ChangedDate: changedDate, HyperLinkCount: 0 },
    children,
    links: []
  };
}

const pbi = (id: number, children: WorkItemDto[] = [], changedDate?: string) => new WorkItem(dto(id, "Product Backlog Item", "Committed", children, changedDate));
const task = (id: number, changedDate?: string) => dto(id, "Task", "Done", [], changedDate);

let rev = 1;
function update(revisedDate: string, fields: WorkItemUpdate["fields"], r = ++rev): WorkItemUpdate {
  return { id: r, rev: r, revisedDate, fields };
}

const build = (items: WorkItem[], updates: Record<number, WorkItemUpdate[]>) => buildRecentActivity(items, updates, since, until, DEFAULT_WORK_ITEM_STATE_CONFIG);

describe("buildRecentActivity", () => {
  test("reports a completed PBI", () => {
    const result = build([pbi(1)], { 1: [update(inside, { "System.State": { oldValue: "Testing", newValue: "Done" } })] });
    expect(result).toHaveLength(1);
    expect(result[0]?.lines).toEqual([{ text: "Completed (Testing → Done)", tone: "positive" }]);
  });

  test("counts completed tasks under their PBI", () => {
    const done = { "System.State": { oldValue: "In Progress", newValue: "Done" } };
    const result = build([pbi(2, [task(21), task(22), task(23)])], { 21: [update(inside, done)], 22: [update(inside, done)], 23: [] });
    expect(result[0]?.lines).toEqual([{ text: "2 tasks completed", tone: "positive" }]);
  });

  test("reports remaining work going up as negative and down as positive", () => {
    const up = build([pbi(3, [task(31)])], { 31: [update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 2, newValue: 4 } })] });
    expect(up[0]?.lines).toEqual([{ text: "Remaining work: +2h", tone: "negative" }]);

    const down = build([pbi(3, [task(31)])], { 31: [update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 4, newValue: 1 } })] });
    expect(down[0]?.lines).toEqual([{ text: "Remaining work: −3h", tone: "positive" }]);
  });

  test("sums hour changes across the PBI's tasks and revisions", () => {
    const result = build([pbi(4, [task(41), task(42)])], {
      41: [update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 1, newValue: 2 } }), update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 2, newValue: 3 } })],
      42: [update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 5, newValue: 4 } })]
    });
    expect(result[0]?.lines).toEqual([{ text: "Remaining work: +1h", tone: "negative" }]);
  });

  test("ignores updates outside the window", () => {
    const result = build([pbi(5, [task(51)])], {
      5: [update(outside, { "System.State": { oldValue: "Testing", newValue: "Done" } })],
      51: [update(outside, { "System.State": { oldValue: "To Do", newValue: "Done" } })]
    });
    expect(result).toEqual([]);
  });

  test("detects added, started and removed tasks", () => {
    const result = build([pbi(6, [task(61), task(62), task(63)])], {
      61: [update(inside, { "System.State": { newValue: "To Do" } }, 1)],
      62: [update(inside, { "System.State": { oldValue: "To Do", newValue: "In Progress" } })],
      63: [update(inside, { "System.State": { oldValue: "To Do", newValue: "Removed" } })]
    });
    expect(result[0]?.lines.map(l => l.text)).toEqual(["1 task started", "1 task added", "1 task removed"]);
  });

  test("lists each task with its title, hours at creation and what happened after", () => {
    const added = dto(61, "Task", "To Do");
    added.System.Title = "Write migration script";
    added.System.AssignedTo = "Sam";
    const noHours = dto(62, "Task", "To Do");
    noHours.System.Title = "Untouched estimate";
    const burned = dto(63, "Task", "Done");
    burned.System.Title = "Existing task";
    const result = build([pbi(6, [added, noHours, burned])], {
      61: [update(inside, { "System.State": { newValue: "To Do" }, "Microsoft.VSTS.Scheduling.RemainingWork": { newValue: 4 } }, 1), update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 4, newValue: 6 } })],
      62: [update(inside, { "System.State": { newValue: "To Do" } }, 1)],
      63: [update(inside, { "System.State": { oldValue: "In Progress", newValue: "Done" }, "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 3, newValue: 0 }, "Microsoft.VSTS.Scheduling.CompletedWork": { oldValue: 1, newValue: 4 } })]
    });
    const tasks = result[0]?.tasks ?? [];
    const byId = Object.fromEntries(tasks.map(t => [t.id, t]));
    expect(byId[61]).toMatchObject({ title: "Write migration script", assignedTo: "Sam" });
    expect(byId[61]?.events).toEqual([
      { text: "Added · 4h", tone: "neutral" },
      { text: "Remaining 4h → 6h", tone: "negative" }
    ]);
    expect(byId[62]?.events).toEqual([{ text: "Added · no hours set", tone: "negative" }]);
    expect(byId[63]?.events.map(e => e.text)).toEqual(["Completed", "Remaining 3h → 0h", "Logged +3h"]);
  });

  test("uses the hours set in a follow-up edit as the starting hours of an added task", () => {
    const added = dto(71, "Task", "To Do");
    added.System.Title = "Created first, estimated after";
    const result = build([pbi(7, [added])], {
      // Rev 1 is just the title; the 9h estimate arrives in a later edit.
      71: [update(inside, { "System.State": { newValue: "To Do" } }, 1), update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { newValue: 9 } }, 2)]
    });
    expect(result[0]?.tasks[0]?.events).toEqual([{ text: "Added · 9h", tone: "neutral" }]);
  });

  test("shows later hour changes after the starting estimate", () => {
    const added = dto(72, "Task", "To Do");
    const result = build([pbi(7, [added])], {
      72: [
        update(inside, { "System.State": { newValue: "To Do" } }, 1),
        update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { newValue: 9 } }, 2),
        update(inside, { "Microsoft.VSTS.Scheduling.RemainingWork": { oldValue: 9, newValue: 5 } }, 3)
      ]
    });
    expect(result[0]?.tasks[0]?.events.map(e => e.text)).toEqual(["Added · 9h", "Remaining 9h → 5h"]);
  });

  test("reports effort changes and nets out a state change that was reverted", () => {
    const result = build([pbi(7)], {
      7: [
        update(inside, { "Microsoft.VSTS.Scheduling.Effort": { oldValue: 5, newValue: 8 } }),
        update(inside, { "System.State": { oldValue: "Committed", newValue: "Testing" } }),
        update(inside, { "System.State": { oldValue: "Testing", newValue: "Committed" } })
      ]
    });
    expect(result[0]?.lines).toEqual([{ text: "Effort: 5 → 8", tone: "neutral" }]);
  });

  test("sorts by most recent activity", () => {
    const done = { "System.State": { oldValue: "Testing", newValue: "Done" } };
    const result = build([pbi(8), pbi(9)], { 8: [update("2026-06-09T20:00:00Z", done)], 9: [update("2026-06-10T10:00:00Z", done)] });
    expect(result.map(r => r.id)).toEqual([9, 8]);
  });
});

describe("collectIdsToFetch", () => {
  test("skips items unchanged since the window start but keeps items with no changed date", () => {
    const items = [pbi(1, [task(11, "2026-06-01T00:00:00Z"), task(12, "2026-06-10T00:00:00Z")], "2026-06-01T00:00:00Z"), pbi(2, [task(21)])];
    expect(collectIdsToFetch(items, since).sort()).toEqual([12, 2, 21]);
  });
});
