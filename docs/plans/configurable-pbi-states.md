# Plan: Configurable PBI state mapping via a Settings tab

## Goal

Turn the now-centralized PBI state categorization (see [align-pbi-states.md](./align-pbi-states.md)) into a user-configurable mapping, editable from a new **Settings** tab, so teams whose ADO process uses custom state names get correct categorization without code changes.

All tabs (Current Team, Multi-Team, Sprint Stats) and all reports (Excel, PDF, DOCX, acceptance criteria) must stay consistent — including the Sprint Stats snapshots.

## Config model

`WorkItemStateConfig` maps ADO state names to one of four categories:

- `Not Started` (also the fallback for unlisted states)
- `In Progress`
- `Done`
- `Removed`

```ts
type WorkItemCategory = "Not Started" | "In Progress" | "Done" | "Removed";

interface WorkItemStateConfig {
  states: Record<string, WorkItemCategory>;
}
```

Defaults preserve the current aligned behavior:

| ADO state                       | Default category |
| ------------------------------- | ---------------- |
| New, Ready, Approved, Committed | Not Started      |
| Blocked, Testing                | In Progress      |
| Staging, Released, Done         | Done             |
| Removed                         | Removed          |

Non-goals (remain hardcoded):

- The sprint tag `-` removal convention.
- Task-level states (`To Do` / `In Progress` / `Done`).
- The `[Study Time]` title-prefix section.

## Architecture

`WorkItem` getters are the single source of truth for categorization and are already consumed by `WorkItemCollection`, `WorkItemTable`, `SprintStatsTab`, and every report generator. The config is therefore injected at `WorkItem` construction (inside `ApiClient`).

Consequences:

- `WorkItemCollection` and the report generators need **no categorization changes** — they receive config-aware `WorkItem`s, so tabs and reports stay consistent automatically.
- Because `WorkItem`s are constructed inside `ApiClient` query functions, the active config must be part of the query keys so changing settings refetches and rebuilds them.
- `SprintStatsTab` constructs its own `ApiClient` (imperative snapshot fetching), so the config also flows into `getSprintSnapshot` and its WIQL filter.

## Phase 1 — Domain & API

1. `src/shared/domain/WorkItemState.ts`
   - Add `WORK_ITEM_CATEGORIES` (`as const`), `WorkItemCategory`, `WorkItemStateConfig`.
   - Add `DEFAULT_WORK_ITEM_STATE_CONFIG` (built from the existing `DONE_STATES` / `IN_PROGRESS_STATES` / `REMOVED_STATE` constants plus `KNOWN_PBI_STATES` as Not Started).
   - Add `categorizeState(state: string, config: WorkItemStateConfig): WorkItemCategory`, falling back to `"Not Started"`.
   - Keep `KNOWN_PBI_STATES` (sandbox typing).

2. `src/shared/domain/WorkItem.ts`
   - Constructor: `constructor(private dto: WorkItemDto, private stateConfig: WorkItemStateConfig = DEFAULT_WORK_ITEM_STATE_CONFIG)`.
   - `isDone` → `categorizeState(this.state, this.stateConfig) === "Done"`.
   - `isRemoved` → `categorizeState(...) === "Removed" || this.sprintTag?.sprintSuffix === "-"`.
   - `isInProgress` → `!this.isDone && !this.isRemoved && (categorizeState(...) === "In Progress" || tasks heuristic)`. The added `!isRemoved` guard prevents a configured-Removed item with started tasks from being reported as in progress.

3. `src/shared/domain/WorkItemCollection.ts`
   - No logic change; update the comment to reference the config. Reuse `WorkItemCategory` from `WorkItemState.ts`.

4. `src/shared/api/ApiClient.ts`
   - Constructor gains an optional `stateConfig`; pass it to `new WorkItem(x)` in both `getIteration2` and `getSprintSnapshot`.
   - **Snapshot WIQL**: replace the hardcoded `AND [System.State] <> 'Removed'` with `AND [System.State] NOT IN (<escaped configured Removed states>)`, so custom Removed states are excluded from snapshots exactly as they are from reports. Escape single quotes in state names. The sprint-tag exclusion stays hardcoded.
   - New `getWorkItemStates(collection, project): Promise<WorkItemTypeState[]>`:
     - GET `.../_apis/wit/workitemtypes/{type}/states?api-version=7.1` for `Product Backlog Item` and `Bug`.
     - Union results by name.
     - Best-effort: warn and return `[]` on failure so the Settings tab still renders defaults + manual entry.

5. `src/shared/api/schemas.ts`
   - Add `WorkItemTypeStateSchema` (`{ name, color?, category }`), parsed with `parseValueArray`.

## Phase 2 — Persistence & context

6. `src/shared/settings/stateConfigStorage.ts` (new)
   - Zod schema: `z.object({ states: z.record(z.string(), z.enum(WORK_ITEM_CATEGORIES)) })`.
   - Storage key: `sprint-report-generator-state-config-${collection}-${project}` (mirrors `teamStorage.ts`).
   - `loadStateConfig`, `saveStateConfig`, `resetStateConfig` (restores defaults). Tolerant parse → defaults on failure.

7. `src/shared/context/SettingsContext.tsx` (new)
   - `SettingsProvider({ collection, project, children })` loads on mount/scope change and persists on update.
   - Exposes `{ stateConfig, setStateConfig, resetStateConfig }` through `useSettings()`, following the `PlatformContext` pattern.
   - Remount by scope (`key={collection-project}`) to avoid stale config across project switches.

## Phase 3 — Consistency wiring

8. `src/shared/api/queryKeys.ts`
   - Add a `configKey` argument (serialized `stateConfig.states`) to `iterationQueryKey` and `sprintStatsQueryKey`.

9. Tabs read `stateConfig` from `useSettings()` and pass it to every `new ApiClient(...)` and to the query key:
   - `src/shared/components/CurrentTeamTab.tsx`
   - `src/shared/components/MultiTeamTab.tsx` (imperative `handleLoadData`)
   - `src/shared/components/SprintStatsTab.tsx` (`fetchSprintStats`)

10. `src/shared/components/SprintStatsTab.tsx` transition-date logic
    - Replace `stateField?.newValue === "Removed"` with `categorizeState(stateField.newValue, stateConfig) === "Removed"`, so removal dates honor custom Removed states.

> Note: changing settings triggers a refetch. Current Team is cheap; Sprint Stats re-walks roughly eight sprint snapshots. Acceptable given settings changes are rare, but worth surfacing in the UI (e.g. a short hint on the Settings tab).

## Phase 4 — Settings UI & surfaces

11. `src/shared/components/SettingsTab.tsx` (new)
    - Props: `origin`, `collection`, `project`, optional `fetchFn`.
    - `useQuery` for `getWorkItemStates`.
    - Renders every known + fetched state (sorted) with a category `Select`.
    - Custom-state `TextInput` + Add, for states not returned by the API.
    - **Reset to defaults** button with confirmation, calling `resetStateConfig`.
    - Auto-saves on change via `setStateConfig`.
    - Uses Mantine components only (no new CSS module, so no `pnpm tcm` run).

12. `src/shared/components/SettingsTab.spec.tsx` (new)
    - Renders fetched + known states.
    - Changing a `Select` persists and updates `useSettings()`.
    - Reset restores `DEFAULT_WORK_ITEM_STATE_CONFIG`.

13. Wire all three surfaces (wrap the Tabs in `SettingsProvider`, add the tab + panel):
    - `src/extension/ExtensionApp.tsx`
    - `src/desktop/renderer.tsx` (provider scoped to `org` / `selectedProject`)
    - `src/userscript/ReportDialog.tsx`

## Phase 5 — Sandbox, tests, verification

14. `src/dev/sandbox.ts`
    - Mock the `workitemtypes/{type}/states` route, including a custom state (e.g. `In Review`) to exercise the flow.
    - Add mock items using custom states.
    - Optionally seed a non-default config to demonstrate re-categorization.

15. Tests
    - New `WorkItemState.spec.ts`: default mapping + `categorizeState` fallback.
    - New `stateConfigStorage.spec.ts`: load/save/reset, invalid JSON → defaults.
    - Extend `WorkItem.spec.ts`: custom config overrides `isDone` / `isInProgress` / `isRemoved`; Removed precedence.
    - Extend `ApiClient.spec.ts`: `getWorkItemStates` success + failure fallback; config passed into `WorkItem`; WIQL `NOT IN` exclusion for configured Removed states.
    - Existing collection/report specs stay green via defaults.

16. Verification
    - `pnpm test`
    - `pnpm typecheck`
    - `pnpm lint` (Biome + Prettier + Knip)
    - `pnpm tcm` only if a CSS module changes (planned: none).
    - Manual check via `pnpm dev` in light and dark mode.

## Notes / non-goals

- Config is localStorage-only and scoped per collection + project; a new device starts at defaults (no server sync).
- `getIteration2` has no state filter, so newly mapped states appear in tabs and reports without any query change.
- No changelog entry or version bump in this plan; fold into the release workflow separately if desired.
