import { encodeUrl } from "../encodeUrl";
import type { WorkItemRequestDto } from "./WorkItemRequestDto";
import type { WorkItemResponseDto } from "./WorkItemResponseDto";

export class WorkItemClient {
  constructor(private origin: string) {}

  public async getRelations(collection: string, project: string, ids: number[]): Promise<WorkItemResponseDto> {
    const url = encodeUrl(`${this.origin}/{0}/{1}/_apis/wit/workitemsbatch`, [collection, project]);
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

    return (await response.json()) as WorkItemResponseDto;
  }
}
