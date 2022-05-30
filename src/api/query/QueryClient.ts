import set from "lodash/set";
import { encodeUrl } from "../encodeUrl";
import { WorkItemClient } from "../workItems/WorkItemClient";
import { IQueryClient } from "./IQueryClient";
import { QueryRequestDto } from "./QueryRequestDto";
import { QueryResponseDto } from "./QueryResponseDto";
import { WorkItemDto } from "./WorkItemDto";

export class QueryClient implements IQueryClient {

    constructor(private origin: string, private workItemRepository: WorkItemClient) {
    }

    public async runQuery(collection: string, project: string, team: string, wiql: string): Promise<WorkItemDto[]> {
        const url = encodeUrl(`${this.origin}/{0}/{1}/{2}/_api/_wit/query?__v=5?api-version5.1`, [collection, project, team]);
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
            
            const parentId = responseDto.sourceIds[i];
            if (parentId > 0) {
                const parent = result.find(x => x.System.Id === parentId);
                parent?.children.push(workItem);
            }
            else {
                result.push(workItem);
            }
        });

        return result;
    }
}
