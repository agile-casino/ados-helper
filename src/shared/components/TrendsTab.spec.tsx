// @vitest-environment happy-dom

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { SettingsProvider } from "../context/SettingsContext";
import { TrendsTab } from "./TrendsTab";

const tabProps = {
  origin: "https://ado.example.com",
  collection: "coll",
  project: "proj",
  team: "team",
  sprint: "Sprint 6",
  iterationPath: "Team\\Sprint 6"
};

function renderInProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <SettingsProvider collection="coll" project="proj">
          {ui}
        </SettingsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

describe("TrendsTab", () => {
  test("shows the Say-Do explanation card alongside the trend card", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    renderInProviders(<TrendsTab {...tabProps} fetchFn={fetchMock} />);

    expect(screen.getByText("Say-Do Ratio")).toBeTruthy();
    expect(screen.getByText("Formula: (Completed committed points ÷ Committed points at start) × 100")).toBeTruthy();
    expect(await screen.findByText("Error Loading Trends")).toBeTruthy();
    expect(screen.getByText("Say-Do Ratio: last 5 sprints")).toBeTruthy();
  });

  test("reports when no sprint has dates", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const body = url.includes("/_apis/work/teamsettings/iterations") ? { value: [] } : {};
      return { ok: true, json: async () => body, text: async () => JSON.stringify(body), status: 200, statusText: "OK" } as Response;
    });
    renderInProviders(<TrendsTab {...tabProps} fetchFn={fetchMock} />);

    expect(await screen.findByText("No Sprints With Dates")).toBeTruthy();
  });
});
