// @vitest-environment happy-dom

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PlatformProvider } from "../context/PlatformContext";
import { SettingsProvider } from "../context/SettingsContext";
import { RecentActivityTab } from "./RecentActivityTab";

const platform = { saveFile: async () => {}, openExternalLink: async () => {} };
const respond = (data: unknown) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data), status: 200, statusText: "OK" }) as Response;

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const fields = (id: number, extra: Record<string, unknown>) => ({
  "System.Id": id,
  "System.Title": `Item ${id}`,
  "System.State": "Committed",
  "System.WorkItemType": "Product Backlog Item",
  "System.AssignedTo": null,
  "System.IterationPath": "proj\\team\\Sprint 13",
  "System.TeamProject": "proj",
  "System.Tags": "",
  "System.HyperLinkCount": 0,
  "System.ChangedDate": hoursAgo(1),
  "Microsoft.VSTS.Scheduling.Effort": 3,
  ...extra
});

function createFetchMock() {
  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.includes("/_apis/work/teamsettings/iterations")) {
      return respond({ value: [{ name: "Sprint 13", path: "proj\\team\\Sprint 13", attributes: { startDate: "2026-01-13T00:00:00Z", finishDate: "2026-01-26T00:00:00Z" } }] });
    }
    if (url.includes("/_apis/work/teamsettings/teamfieldvalues")) return respond({ defaultValue: "proj\\Engineering\\team" });
    if (url.includes("/_apis/wit/wiql")) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return (body.query as string).includes("WorkItemLinks") ? respond({ workItemRelations: [] }) : respond({ workItems: [{ id: 401 }] });
    }
    if (url.includes("/_apis/wit/workitemsbatch")) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return body.$expand === "relations" ? respond({ value: [{ id: 401, relations: [] }] }) : respond({ value: [{ id: 401, fields: fields(401, {}) }] });
    }
    if (url.includes("/_apis/wit/workitems/401/updates")) {
      return respond({
        value: [
          { id: 2, rev: 2, revisedDate: hoursAgo(30), fields: { "System.State": { oldValue: "Committed", newValue: "Testing" } } },
          { id: 3, rev: 3, revisedDate: hoursAgo(2), fields: { "Microsoft.VSTS.Scheduling.Effort": { oldValue: 3, newValue: 5 } } }
        ]
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
}

const props = { origin: "https://dev.azure.com/org", collection: "coll", project: "proj", team: "team", sprint: "Sprint 13", iterationPath: "Sprint 13" };

function renderTab() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PlatformProvider value={platform}>
        <MantineProvider env="test">
          <SettingsProvider collection="coll" project="proj">
            <RecentActivityTab {...props} />
          </SettingsProvider>
        </MantineProvider>
      </PlatformProvider>
    </QueryClientProvider>
  );
}

describe("RecentActivityTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("shows only changes inside the default 24h window, and widens when the lookback grows", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    renderTab();

    expect(await screen.findByText("Effort: 3 → 5")).toBeTruthy();
    expect(screen.queryByText(/Committed → Testing/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "48h" }));

    expect(await screen.findByText("Started (Committed → Testing)")).toBeTruthy();
    expect(localStorage.getItem("sprint-report-generator-lookback-hours-coll-proj")).toBe("48");
  });

  test("restores the saved lookback and reports an empty window", async () => {
    localStorage.setItem("sprint-report-generator-lookback-hours-coll-proj", "1");
    vi.stubGlobal("fetch", createFetchMock());
    renderTab();

    await waitFor(() => expect(screen.getByText(/No work item changes in the last 1 hours/)).toBeTruthy());
  });
});
