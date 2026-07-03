import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "./ApiClient";
import type { IQueryClient } from "./query/IQueryClient";
import type { IWorkItemClient } from "./workItems/IWorkItemClient";

describe("ApiClient", () => {
  const mockQueryClient = {} as IQueryClient;
  const mockWorkItemClient = {} as IWorkItemClient;
  const origin = "https://dev.azure.com/org";

  it("getWorkItemUpdates_returns_updates_on_success", async () => {
    const mockUpdates = {
      count: 2,
      value: [
        { id: 1, rev: 1, revisedDate: "2026-06-01" },
        { id: 2, rev: 2, revisedDate: "2026-06-05" }
      ]
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockUpdates
    } as Response);

    const client = new ApiClient(origin, mockQueryClient, mockWorkItemClient);
    const updates = await client.getWorkItemUpdates("coll", "proj", 123);

    expect(fetchSpy).toHaveBeenCalledWith("https://dev.azure.com/org/coll/proj/_apis/wit/workitems/123/updates?api-version=6.0");
    expect(updates).toEqual(mockUpdates.value);

    fetchSpy.mockRestore();
  });

  it("getWorkItemUpdates_returns_empty_array_on_failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    } as Response);

    const client = new ApiClient(origin, mockQueryClient, mockWorkItemClient);
    const updates = await client.getWorkItemUpdates("coll", "proj", 123);

    expect(updates).toEqual([]);

    fetchSpy.mockRestore();
  });
});
