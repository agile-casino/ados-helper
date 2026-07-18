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

type MockResponses = {
  wiql?: unknown;
  batchFields?: unknown;
  batchRelations?: unknown;
  iterations?: unknown;
  teamFieldValues?: unknown;
};

function createApiMock(responses: MockResponses) {
  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    const respond = (data: unknown) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data), status: 200, statusText: "OK" }) as Response;

    if (url.includes("/_apis/wit/wiql") && responses.wiql !== undefined) return respond(responses.wiql);
    if (url.includes("/_apis/wit/workitemsbatch")) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      if (body.$expand === "relations" && responses.batchRelations !== undefined) return respond(responses.batchRelations);
      if (responses.batchFields !== undefined) return respond(responses.batchFields);
    }
    if (url.includes("/_apis/work/teamsettings/iterations") && responses.iterations !== undefined) return respond(responses.iterations);
    if (url.includes("/_apis/work/teamsettings/teamfieldvalues") && responses.teamFieldValues !== undefined) return respond(responses.teamFieldValues);

    throw new Error(`Unexpected URL: ${url}`);
  });
}

const mockIters = {
  value: [
    {
      name: "Sprint 13",
      path: "proj\\team\\Sprint 13",
      attributes: { startDate: "2026-01-13T00:00:00Z", finishDate: "2026-01-26T00:00:00Z" }
    }
  ]
};

const commonFields = {
  "System.Title": "Item",
  "System.State": "In Progress",
  "System.WorkItemType": "Product Backlog Item",
  "System.AssignedTo": null,
  "System.IterationPath": "proj\\team\\Sprint 13",
  "System.TeamProject": "proj",
  "System.Tags": "",
  "System.HyperLinkCount": 0,
  "Microsoft.VSTS.Scheduling.Effort": 0,
  "Microsoft.VSTS.Scheduling.RemainingWork": null,
  "Microsoft.VSTS.Scheduling.OriginalEstimate": null,
  "Microsoft.VSTS.Scheduling.CompletedWork": null,
  "Microsoft.VSTS.Common.ActivatedDate": null
};

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

  describe("getSprintSnapshot", () => {
    it("returns work items for WirelineRnD project", async () => {
      const fetchSpy = createApiMock({
        wiql: { workItems: [{ id: 101 }, { id: 102 }] },
        batchFields: {
          value: [
            { id: 101, fields: { ...commonFields, "System.Id": 101, "System.Title": "PBI One", "System.WorkItemType": "Product Backlog Item", "Microsoft.VSTS.Scheduling.Effort": 5 } },
            { id: 102, fields: { ...commonFields, "System.Id": 102, "System.Title": "Bug One", "System.WorkItemType": "Bug", "Microsoft.VSTS.Scheduling.Effort": 3 } }
          ]
        }
      });

      const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
      const workItems = await client.getSprintSnapshot("coll", "WirelineRnD", "team", "Sprint 13", "Sprint 13", new Date("2026-01-20"));

      expect(workItems).toHaveLength(2);
      expect(workItems[0]?.title).toBe("PBI One");
      expect(workItems[1]?.title).toBe("Bug One");
      expect(workItems[0]?.effort).toBe(5);
      expect(workItems[1]?.effort).toBe(3);
    });

    it("returns work items for non-WirelineRnD project with area path", async () => {
      const fetchSpy = createApiMock({
        teamFieldValues: { defaultValue: "proj\\Engineering\\team" },
        wiql: { workItems: [{ id: 201 }] },
        batchFields: {
          value: [{ id: 201, fields: { ...commonFields, "System.Id": 201, "System.Title": "PBI Two", "System.WorkItemType": "Product Backlog Item" } }]
        }
      });

      const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
      const workItems = await client.getSprintSnapshot("coll", "OtherProject", "team", "Sprint 13", "Sprint 13", new Date("2026-01-20"));

      expect(workItems).toHaveLength(1);
      expect(workItems[0]?.title).toBe("PBI Two");
    });

    it("returns empty array when no work items match", async () => {
      const fetchSpy = createApiMock({
        wiql: { workItems: [] },
        batchFields: { value: [] }
      });

      const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
      const workItems = await client.getSprintSnapshot("coll", "WirelineRnD", "team", "Sprint 13", "Sprint 13", new Date("2026-01-20"));

      expect(workItems).toHaveLength(0);
    });
  });

  describe("getIteration2", () => {
    it("returns work items with area path filter", async () => {
      const fetchSpy = createApiMock({
        teamFieldValues: { defaultValue: "proj\\Engineering\\team" },
        wiql: {
          workItemRelations: [{ source: { id: 301 }, target: { id: 302 } }]
        },
        batchFields: {
          value: [
            { id: 301, fields: { ...commonFields, "System.Id": 301, "System.Title": "Bug Item", "System.WorkItemType": "Bug", "Microsoft.VSTS.Scheduling.Effort": 5 } },
            { id: 302, fields: { ...commonFields, "System.Id": 302, "System.Title": "Linked Task", "System.WorkItemType": "Task", "System.State": "In Progress" } }
          ]
        },
        batchRelations: {
          value: [{ id: 302, relations: [{ rel: "System.LinkTypes.Hierarchy-Reverse", url: "http://vso/parent/301" }] }]
        },
        iterations: mockIters
      });

      const client = new ApiClient("https://dev.azure.com/org", fetchSpy);
      const result = await client.getIteration2("coll", "proj", "team", "Sprint 13");

      expect(result.workItems).toHaveLength(1);
      expect(result.workItems[0]?.title).toBe("Bug Item");
      expect(result.workItems[0]?.tasks).toHaveLength(1);
      expect(result.workItems[0]?.tasks[0]?.System.Title).toBe("Linked Task");
    });
  });
});
