# Plan: Align PBI state handling with the new state list

## Goal

Update the report generator so that:

1. "Done" points are calculated correctly under the new PBI state model.
2. PBIs in newly introduced states (previously unknown to the code) are displayed on the **Current Team** and **Multi-Team** tabs.

## New PBI state list

- New
- Ready
- Approved
- Blocked
- Committed
- Testing
- Staging
- Released
- Done
- Removed

## Key finding

All four surfaces (Current Team tab, Multi-Team tab, and the Excel/PDF/DOCX reports) derive their sections and point totals from two classes:

- `WorkItem` — `src/shared/domain/WorkItem.ts:48-58`
- `WorkItemCollection.getWorkItemCategory` — `src/shared/domain/WorkItemCollection.ts:92`

The change is therefore centralized: no generator-specific edits are required.

## Confirmed state mapping

| ADO state                         | Category / behavior                                |
| --------------------------------- | -------------------------------------------------- |
| Done, Staging, Released           | **Done** (counts toward Done/Completed points)     |
| Blocked, Testing                  | **In Progress**                                    |
| New, Ready, Approved, Committed   | **Not Started**                                    |
| Removed (state) or sprint tag `-` | **Removed**                                        |
| Any state with a started task     | **In Progress** (existing task heuristic retained) |

## Changes

### 1. Add a central state constants module

New file `src/shared/domain/WorkItemState.ts`:

- `DONE_STATES = ["Done", "Staging", "Released"]`
- `IN_PROGRESS_STATES = ["Blocked", "Testing"]`
- `REMOVED_STATE = "Removed"`
- `KNOWN_PBI_STATES` — union of all 10 states (for sandbox typing/reuse)

Prevents the string literals from continuing to sprawl across specs and sandbox.

### 2. `src/shared/domain/WorkItem.ts`

- `isDone` -> use `DONE_STATES` (behavior unchanged: Done/Staging/Released).
- `isInProgress` -> `!isDone && (IN_PROGRESS_STATES.includes(state) || tasks.some(t => t.System.State !== "To Do"))`.
  This is the fix that displays Blocked/Testing PBIs under In Progress even when they have no started child tasks.
- `isRemoved` -> `state === "Removed" || sprintTag?.sprintSuffix === "-"`.
  This ensures Removed-state PBIs are excluded from `committedWorkItems`/`completedEffort` (so commitment % and Done points are not skewed) and appear in the Removed section.

### 3. `src/shared/domain/WorkItemCollection.ts`

- `getWorkItemCategory` needs no logic change (it delegates to the getters), but add a `KNOWN_PBI_STATES` guard/comment and confirm precedence: Study Time -> Done -> Removed -> In Progress -> Not Started.
- Decision to flag: Done is currently checked before Removed, so a Done item tagged `-` stays Done. Recommend leaving that precedence unchanged (out of scope) unless Removed should win.

### 4. `src/dev/sandbox.ts`

- Extend `MockWorkItem.state` union to include the new states (plus legacy task states `"To Do" | "In Progress"` so task fixtures still typecheck).
- Add mock items in states Ready/Blocked/Testing/Committed so the sandbox exercises all branches.

### 5. Tests

- `WorkItem.spec.ts`: add `isInProgress` true for Blocked/Testing with no started tasks; false for Committed/Ready/Approved/New; `isRemoved` true for state `"Removed"`; `isDone` false for Testing.
- `WorkItemCollection.spec.ts`: category assertions for each new state.
- `WorkItemCollection.commitment.spec.ts`: a Removed-state item is excluded from `committedEffort`/`completedEffort`.
- `ReportGenerator.spec.ts` (and optionally PDF/DOCX specs): a Testing/Blocked item renders under In Progress, Committed under Not Started.

### 6. Optional cleanup

`SprintStatsTab.tsx:28,40` replaces `w.state !== "Removed" && w.sprintTag?.sprintSuffix !== "-"` with `!w.isRemoved` to use the single source of truth (identical behavior after change #2).

### 7. Verification

Run `pnpm test`, `pnpm typecheck`, `pnpm lint` (Biome + Prettier + Knip). No CSS module regeneration needed.

## Notes / non-goals

- The WIQL queries (`ApiClient.ts:182` excludes `System.State <> 'Removed'`; `getIteration2` has no state filter) already return all new states, so **no API/query changes are needed** — the display gap was purely categorization.
- Task-level states (`To Do`/`In Progress`/`Done`) are left as-is; the new list applies to PBIs/Bugs.
- No version bump or changelog entry in this plan; fold into the release workflow separately if desired.
