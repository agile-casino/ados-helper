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
        "Accept": "application/json;api-version=5.1"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Fetch work items failed with status ${response.status}:`, text);
      throw new Error(`Fetch work items failed: HTTP ${response.status} - ${text}`);
    }

    return (await response.json()) as WorkItemResponseDto;
  }
}
