import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "./ApiClient";

function mockFetch(data: unknown, ok = true): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error"
  } as Response);
}

describe("ApiClient", () => {
  it("getWorkItemUpdates_returns_updates_on_success", async () => {
    const fetchSpy = mockFetch({
      count: 2,
      value: [
        { id: 1, rev: 1, revisedDate: "2026-06-01" },
        { id: 2, rev: 2, revisedDate: "2026-06-05" }
      ]
    });

    const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
    const updates = await client.getWorkItemUpdates("coll", "proj", 123);

    expect(fetchSpy).toHaveBeenCalledWith("https://dev.azure.com/org/coll/proj/_apis/wit/workitems/123/updates?api-version=7.1");
    expect(updates).toHaveLength(2);
  });

  it("getWorkItemUpdates_returns_empty_array_on_failure", async () => {
    const fetchSpy = mockFetch(null, false);

    const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
    const updates = await client.getWorkItemUpdates("coll", "proj", 123);

    expect(updates).toEqual([]);
  });

  it("getIterations_returns_mapped_result", async () => {
    const fetchSpy = mockFetch({
      value: [
        {
          name: "Sprint 1",
          path: "Project\\Sprint 1",
          attributes: {
            startDate: "2026-01-13T00:00:00Z",
            finishDate: "2026-01-26T00:00:00Z"
          }
        }
      ]
    });

    const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
    const iterations = await client.getIterations("coll", "proj", "team");

    expect(iterations).toHaveLength(1);
    const iter = iterations[0];
    expect(iter).toBeDefined();
    expect(iter?.name).toBe("Sprint 1");
    expect(iter?.attributes?.startDate).toBe("2026-01-13T00:00:00Z");
  });

  it("getIterationDates_returns_dates_for_matching_iteration", async () => {
    const fetchSpy = mockFetch({
      value: [
        {
          name: "Sprint 13",
          path: "Project\\Team\\Sprint 13",
          attributes: {
            startDate: "2026-07-13T00:00:00Z",
            finishDate: "2026-07-26T00:00:00Z"
          }
        }
      ]
    });

    const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
    const dates = await client.getIterationDates("coll", "proj", "team", "Sprint 13");

    expect(dates.startDate?.toISOString()).toBe("2026-07-13T00:00:00.000Z");
    expect(dates.finishDate?.toISOString()).toBe("2026-07-26T00:00:00.000Z");
  });

  it("getTeamAreaPath_returns_default_value_from_api", async () => {
    const fetchSpy = mockFetch({ defaultValue: "Project\\Team\\Area" });

    const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
    const path = await client.getTeamAreaPath("coll", "proj", "team");

    expect(path).toBe("Project\\Team\\Area");
  });
});
