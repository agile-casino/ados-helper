import { calculateCompletedPoints, calculateSayDo, getCommitSnapshotDate, getFinalSnapshotDate, type SayDoResult } from "../domain/sayDo";
import type { ApiClient } from "./ApiClient";

export interface SprintSayDoRequest {
  collection: string;
  project: string;
  team: string;
  sprint: string;
  /** Iteration path with the project prefix removed. */
  iterationPath: string;
  startDate: Date;
  finishDate: Date;
}

/**
 * Say-Do Ratio for one sprint, using the same snapshot dates and formula as the Sprint Stats tab.
 * Used by every tab that shows the Say-Do Ratio so the numbers cannot drift apart.
 * Also returns points completed at the final snapshot, which comes from the same data.
 */
export async function fetchSprintSayDo(apiClient: ApiClient, request: SprintSayDoRequest, now: Date = new Date()): Promise<SayDoResult & { completedPoints: number }> {
  const { collection, project, team, sprint, iterationPath, startDate, finishDate } = request;
  const [initialItems, finalItems] = await Promise.all([
    apiClient.getSprintSnapshot(collection, project, team, sprint, iterationPath, getCommitSnapshotDate(startDate)),
    apiClient.getSprintSnapshot(collection, project, team, sprint, iterationPath, getFinalSnapshotDate(finishDate, now))
  ]);
  return { ...calculateSayDo(initialItems, finalItems), completedPoints: calculateCompletedPoints(finalItems) };
}
