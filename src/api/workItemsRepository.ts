import { encodeUrl } from "./encodeUrl";

interface WorkItemRequestDto {
    $expand: string;
    fields: string[];
    ids: number[];
}

interface WorkItemResponseDto {
    value: [
        {
            id: number;
            relations: [
                { rel: string; url: string; }
            ]
        }
    ]
}

export async function getRelations(collection: string, project: string, ids: number[]): Promise<WorkItemResponseDto> {
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/_apis/wit/workitemsbatch`, [collection, project]);
    const body: WorkItemRequestDto = {
        $expand: "relations",
        fields: [],
        ids: ids
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "Accept: application/json;api-version=5.1"
        },
        body: JSON.stringify(body)
    });

    return await response.json() as WorkItemResponseDto;
}