import type { WorkItemDto } from "./WorkItemDto";

export interface IQueryClient {
  runQuery(collection: string, project: string, team: string, wiql: string): Promise<WorkItemDto[]>;
}
