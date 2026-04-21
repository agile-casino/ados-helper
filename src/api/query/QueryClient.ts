import set from "lodash/set";
import { encodeUrl } from "../encodeUrl";
import type { WorkItemClient } from "../workItems/WorkItemClient";
import type { IQueryClient } from "./IQueryClient";
import type { QueryRequestDto } from "./QueryRequestDto";
import type { QueryResponseDto } from "./QueryResponseDto";
import type { WorkItemDto } from "./WorkItemDto";

export class QueryClient implements IQueryClient {
  constructor(
    private origin: string,
    _workItemRepository: WorkItemClient
  ) {}

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

    const responseDto = (await response.json()) as QueryResponseDto;

    const result: WorkItemDto[] = [];

    responseDto.payload.rows.forEach((row, i) => {
      // biome-ignore lint/suspicious/noExplicitAny: TODO proper typings
      const workItem: any = { children: [], links: [] };
      responseDto.payload.columns.forEach((column, index) => {
        set(workItem, column, row[index]);
      });

      const parentId = responseDto.sourceIds[i];
      if (parentId !== undefined && parentId > 0) {
        const parent = result.find(x => x.System.Id === parentId);
        parent?.children.push(workItem);
      } else {
        result.push(workItem);
      }
    });

    return result;
  }
}
