export const iterationQueryKey = (origin: string, collection: string, project: string, team: string, iterationPath: string) => ["iteration", origin, collection, project, team, iterationPath] as const;

export const sprintStatsQueryKey = (origin: string, collection: string, project: string, team: string, sprint: string, iterationPath: string) => ["sprint-stats", origin, collection, project, team, sprint, iterationPath] as const;
