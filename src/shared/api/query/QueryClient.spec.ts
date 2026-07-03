import { describe, expect, it, vi } from "vitest";
import type { WorkItemClient } from "../workItems/WorkItemClient";
import { QueryClient } from "./QueryClient";
import type { QueryResponseDto } from "./QueryResponseDto";

describe("QueryClient", () => {
  const origin = "https://dev.azure.com/org";
  const mockWorkItemClient = {} as WorkItemClient;

  it("should make a POST request with correct URL, headers and body", async () => {
    const mockResponseDto: QueryResponseDto = {
      payload: {
        columns: ["System.Id", "System.Title"],
        rows: [[101, "Test Work Item"]]
      }
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponseDto
    } as Response);

    const client = new QueryClient(origin, mockWorkItemClient);
    const result = await client.runQuery("coll", "proj", "team", "SELECT * FROM WorkItems");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://dev.azure.com/org/coll/proj/team/_api/_wit/query?__v=5?api-version5.1",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ wiql: "SELECT * FROM WorkItems" })
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.System.Id).toBe(101);
    expect(result[0]?.System.Title).toBe("Test Work Item");

    fetchSpy.mockRestore();
  });

  it("should reconstruct parent-child hierarchy based on sourceIds", async () => {
    const mockResponseDto: QueryResponseDto = {
      payload: {
        columns: ["System.Id", "System.Title"],
        rows: [
          [100, "Parent Item"],
          [101, "Child Item 1"],
          [102, "Child Item 2"]
        ]
      },
      sourceIds: [0, 100, 100]
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponseDto
    } as Response);

    const client = new QueryClient(origin, mockWorkItemClient);
    const result = await client.runQuery("coll", "proj", "team", "wiql-query");

    // Only the parent should be in the root array
    expect(result).toHaveLength(1);
    expect(result[0]?.System.Id).toBe(100);
    expect(result[0]?.children).toHaveLength(2);
    expect(result[0]?.children[0]?.System.Id).toBe(101);
    expect(result[0]?.children[1]?.System.Id).toBe(102);

    fetchSpy.mockRestore();
  });

  it("should throw an error if the fetch response is not ok", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request"
    } as Response);

    const client = new QueryClient(origin, mockWorkItemClient);

    await expect(client.runQuery("coll", "proj", "team", "wiql-query")).rejects.toThrow("Query failed: HTTP 400 - Bad Request");

    fetchSpy.mockRestore();
  });

  it("should return empty list when rows are empty", async () => {
    const mockResponseDto: QueryResponseDto = {
      payload: {
        columns: ["System.Id"],
        rows: []
      }
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponseDto
    } as Response);

    const client = new QueryClient(origin, mockWorkItemClient);
    const result = await client.runQuery("coll", "proj", "team", "wiql-query");

    expect(result).toEqual([]);

    fetchSpy.mockRestore();
  });
});
