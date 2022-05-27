import set from "lodash/set";
import { encodeUrl } from "./encodeUrl";
import { getRelations } from "./workItemsRepository";

interface QueryRequestDto {
    wiql: string;
}

interface QueryResponseDto {
    payload: {
        columns: string[];
        rows: (string|number)[][];
    },
    sourceIds: number[]
}

export interface WorkItemDto {
    Microsoft: {
        VSTS: {
            Scheduling: {
                Effort: number;
                RemainingWork: number;
            }
        }
    },
    System: {
        Id: number;
        WorkItemType: string;
        TeamProject: string;
        Rev: number;
        Tags: string;
        State: string;
        AssignedTo: string|null;
        Title: string;
        IterationPath: string;
        HyperLinkCount: number;
    },
    children: WorkItemDto[];
    links: string[];
}

export async function RunQuery(collection: string, project: string, team: string, wiql: string): Promise<WorkItemDto[]> {
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/{2}/_api/_wit/query?__v=5?api-version5.1`, [collection, project, team]);
    const body: QueryRequestDto = {
        wiql: wiql
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const responseDto = await response.json() as QueryResponseDto;

    const result: WorkItemDto[] = [];

    responseDto.payload.rows.forEach((row,i) => {

        const workItem: any = { children: [], links: [] }; // eslint-disable-line @typescript-eslint/no-explicit-any
        responseDto.payload.columns.forEach((column, index) => {
            set(workItem, column, row[index]);
        });

        // little bit hacky, look into updating query
        if (workItem.System.WorkItemType !== "Product Backlog Item" && workItem.System.WorkItemType !== "Task") {
            return;
        }
        
        const parentId = responseDto.sourceIds[i];
        if (parentId > 0) {
            const parent = result.find(x => x.System.Id === parentId);
            parent?.children.push(workItem);
        }
        else {
            result.push(workItem);
        }
    });

    const ids = result.map(x => x.System.Id);
    if (ids.length) {
        const relations = await getRelations(collection, project, ids);
        relations.value.forEach(r => {
            const workItem = result.find(workItem => workItem.System.Id === r.id);
            if (workItem) {
                workItem.links = r.relations.map(l => l.url);
            }
        });
        console.log(result);
    }

    return result;
}
