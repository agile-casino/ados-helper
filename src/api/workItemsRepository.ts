import { encodeUrl } from "./encodeUrl";

export interface WorkItemsDto {
    workItemRelations: WorkItemRelationDto[];
}

export interface WorkItemRelationDto {
    rel: string;
    source: WorkItemReferenceDto;
    target: WorkItemReferenceDto;
}

export interface WorkItemReferenceDto {
    id: string;
    url: string;
}

export async function getWorkItems(collection: string, project: string, team: string, iterationId: string): Promise<WorkItemsDto> {
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/{2}/_apis/work/teamsettings/iterations/{3}/workItems?api-version6.0`, [collection, project, team, iterationId]);
    const response = await fetch(url);
    return await response.json();
}
