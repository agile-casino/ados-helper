// @vitest-environment happy-dom

import { MantineProvider, Tabs, Text } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PlatformProvider } from "../context/PlatformContext";
import type { PlatformService } from "../services/PlatformService";
import { CurrentTeamTab } from "./CurrentTeamTab";

const platformService: PlatformService = {
  saveFile: async () => {},
  openExternalLink: async () => {}
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

function createIterationFetchMock() {
  const respond = (data: unknown) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data), status: 200, statusText: "OK" }) as Response;

  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.includes("/_apis/work/teamsettings/iterations")) {
      return respond({
        value: [
          {
            name: "Sprint 13",
            path: "proj\\team\\Sprint 13",
            attributes: { startDate: "2026-01-13T00:00:00Z", finishDate: "2026-01-26T00:00:00Z" }
          }
        ]
      });
    }
    if (url.includes("/_apis/work/teamsettings/teamfieldvalues")) return respond({ defaultValue: "proj\\Engineering\\team" });
    if (url.includes("/_apis/wit/wiql")) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      if ((body.query as string).includes("WorkItemLinks")) {
        return respond({ workItemRelations: [] });
      }
      return respond({ workItems: [{ id: 401 }] });
    }
    if (url.includes("/_apis/wit/workitemsbatch")) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      if (body.$expand === "relations") {
        return respond({ value: [{ id: 401, relations: [] }] });
      }
      return respond({
        value: [{ id: 401, fields: { ...commonFields, "System.Id": 401, "System.Title": "Standalone PBI", "System.WorkItemType": "Product Backlog Item" } }]
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
}

function renderInProviders(ui: ReactElement, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PlatformProvider value={platformService}>
        <MantineProvider>{ui}</MantineProvider>
      </PlatformProvider>
    </QueryClientProvider>
  );
}

const tabProps = {
  origin: "https://dev.azure.com/org",
  collection: "coll",
  project: "proj",
  team: "team",
  sprint: "Sprint 13",
  iterationPath: "Sprint 13"
};

describe("CurrentTeamTab", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders work items fetched from the API", async () => {
    const fetchMock = createIterationFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderInProviders(<CurrentTeamTab {...tabProps} />, new QueryClient());

    expect(await screen.findByRole("link", { name: "401" })).toBeTruthy();
    expect(screen.getByText("Standalone PBI")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalled();
  });

  test("does not refetch when switching away and back within staleTime", async () => {
    const fetchMock = createIterationFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60_000,
          refetchOnWindowFocus: false
        }
      }
    });

    renderInProviders(
      <Tabs defaultValue="current-team">
        <Tabs.List>
          <Tabs.Tab value="current-team">Current Team</Tabs.Tab>
          <Tabs.Tab value="other">Other</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="current-team">
          <CurrentTeamTab {...tabProps} />
        </Tabs.Panel>
        <Tabs.Panel value="other">
          <Text>Other content</Text>
        </Tabs.Panel>
      </Tabs>,
      queryClient
    );

    await screen.findByRole("link", { name: "401" });
    const callsAfterLoad = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole("tab", { name: "Other" }));
    fireEvent.click(screen.getByRole("tab", { name: "Current Team" }));

    expect(await screen.findByRole("link", { name: "401" })).toBeTruthy();
    expect(fetchMock.mock.calls.length).toBe(callsAfterLoad);
  });
});
