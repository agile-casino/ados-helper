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
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/{2}/_apis/work/teamsettings/iterations/{3}/workItems?api-version5.1`, [collection, project, team, iterationId]);
    const response = await fetch(url);
    return await response.json();
}

export interface WorkItemDetailsDto {
    id: string;
    url: string;
    fields: {
        "Microsoft.VSTS.Scheduling.Effort": number,
        "System.AssignedTo": UserDetailsDto,
        "System.Title": string,
        "System.State": string
    }
}

export interface UserDetailsDto {
    id: string;
    displayName: string;
}

export async function getWorkItemDetails(collection: string, project: string, workItemIds: string[]): Promise<WorkItemDetailsDto[]> {
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/_apis/wit/workitemsbatch?api-version=5.1`, [collection, project]);
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ ids: workItemIds })
    });
    var result = await response.json();
    console.log(result);
    return result.value;
}
