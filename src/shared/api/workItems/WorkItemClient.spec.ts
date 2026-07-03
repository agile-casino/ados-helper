import { describe, expect, it, vi } from "vitest";
import { WorkItemClient } from "./WorkItemClient";
import type { WorkItemResponseDto } from "./WorkItemResponseDto";

describe("WorkItemClient", () => {
  const origin = "https://dev.azure.com/org";

  it("should post batch request with correct headers, url, and body on success", async () => {
    const mockResponse = {
      count: 2,
      value: [
        {
          id: 101,
          relations: [{ rel: "System.LinkTypes.Hierarchy-Forward", url: "https://child-url" }]
        },
        {
          id: 102,
          relations: []
        }
      ]
    } as unknown as WorkItemResponseDto;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const client = new WorkItemClient(origin);
    const result = await client.getRelations("coll", "proj", [101, 102]);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://dev.azure.com/org/coll/proj/_apis/wit/workitemsbatch",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json;api-version=5.1"
        },
        body: JSON.stringify({
          $expand: "relations",
          fields: [],
          ids: [101, 102]
        })
      })
    );
    expect(result).toEqual(mockResponse);

    fetchSpy.mockRestore();
  });

  it("should throw error if the batch request fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found"
    } as Response);

    const client = new WorkItemClient(origin);

    await expect(client.getRelations("coll", "proj", [101])).rejects.toThrow("Fetch work items failed: HTTP 404 - Not Found");

    fetchSpy.mockRestore();
  });
});
