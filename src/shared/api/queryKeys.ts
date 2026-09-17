export const iterationQueryKey = (origin: string, collection: string, project: string, team: string, iterationPath: string, configKey: string) => ["iteration", origin, collection, project, team, iterationPath, configKey] as const;

export const sprintStatsQueryKey = (origin: string, collection: string, project: string, team: string, sprint: string, iterationPath: string, configKey: string) =>
  ["sprint-stats", origin, collection, project, team, sprint, iterationPath, configKey] as const;

export const workItemStatesQueryKey = (origin: string, collection: string, project: string) => ["work-item-states", origin, collection, project] as const;
