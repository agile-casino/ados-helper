# TanStack Query Migration Plan

Migrate server data fetching out of `useEffect` into TanStack Query so cached data
survives tab switches (fixes the refetch-on-tab-switch bug) and makes refresh
explicit via cache invalidation.

## Background

Mantine 9 `Tabs` defaults to `keepMounted: true` with `keepMountedMode: "activity"`,
which wraps inactive panels in React 19's `<Activity mode="hidden">`. React's
`<Activity>` tears down effects when a panel is hidden and re-runs effect setup when
it becomes visible again. `CurrentTeamTab` and `SprintStatsTab` fetch in mount-only
`useEffect`s, so returning to a tab refetches every time.

## Changes

### 1. Add dependency

```bash
pnpm add @tanstack/react-query
```

### 2. New `src/shared/api/queryClient.ts`

Module-level `QueryClient` so all apps and the extension's refresh button share one
cache. Defaults that stop the refetch-on-remount:

- `staleTime: 5 * 60_000` — cached data returned for 5 minutes; after that, a
  background refetch on remount (stale-while-revalidate).
- `refetchOnWindowFocus: false` — avoid surprise calls when returning to the ADOS
  browser tab.

### 3. New `src/shared/api/queryKeys.ts`

Query key factories (plain serializable data, no functions):

- `iterationQueryKey(origin, collection, project, team, iterationPath)`
- `sprintStatsQueryKey(origin, collection, project, team, sprint, iterationPath)`

Deliberately exclude `fetchFn` from keys — a function hashes to its source text, so
two `authFetch` instances would collide anyway. Instead the `queryFn` closes over
`fetchFn` and refresh uses `invalidateQueries`.

### 4. Wrap entry points in `QueryClientProvider`

Wrap all three entry points so shared tab components get caching from a single
provider:

- `ExtensionApp.tsx`
- `DesktopApp` in `renderer.tsx`
- userscript `App.tsx` (covers the dev sandbox too)

### 5. `CurrentTeamTab.tsx` → `useQuery`

Replace the `useEffect` + loading state with:

- `enabled: Boolean(collection && project && team && sprint)`
- `queryFn: () => new ApiClient(origin, fetchFn).getIteration2(...)`

`loading` → `query.isPending`; work items/dates from `query.data`.

### 6. `SprintStatsTab.tsx` → `useQuery`

Extract the entire `fetchStats` body into a standalone
`fetchSprintStats(...): Promise<SprintStatsData>` (dates, committed/snapshot dates,
initial/final items, previous sprints, transition dates). Use a single `useQuery`;
map existing render branches to `isPending` / `error` / missing-dates.

### 7. Extension refresh button → explicit invalidation

Replace `setRefreshKey(c => c + 1)` with `queryClient.invalidateQueries()` and drop
the `refreshKey` / `authFetch`-recreation memo. `authFetch` fetches a fresh token
per call, so a stale closure is harmless. All mounted queries refetch on refresh.

### 8. `MultiTeamTab.tsx`

Unchanged — button-triggered load; local state survives `Activity`. Future option:
`useQueries` / `useMutation`.

### 9. New `CurrentTeamTab.spec.tsx`

Render with `QueryClientProvider` + mocked `fetch`; assert data renders and that
switching away/back triggers no second fetch (within `staleTime`). Uses the
happy-dom setup already in `tests/setup.ts`.

### 10. Verify

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Behavior after

- Switching tabs within `staleTime`: instant, zero network calls.
- Manual refresh button: refetches all tabs immediately.
- Bonus: reopening the userscript dialog reuses cache instead of refetching.

## Tradeoffs

- ~13 kB gzipped dependency.
- Real refactor of the two tab components; the `SprintStatsTab` extraction is the
  most delicate piece.
- `staleTime: 5 min` chosen; `Infinity` would make the manual refresh button the
  only way to update.
