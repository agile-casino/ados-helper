import { WorkItemResponseDto } from "./WorkItemResponseDto";

export interface IWorkItemClient {
    getRelations(collection: string, project: string, ids: number[]): Promise<WorkItemResponseDto>;
}
