// @vitest-environment happy-dom

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
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
  test("keeps the Say-Do explanation in a collapsible section", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    renderInProviders(<TrendsTab {...tabProps} fetchFn={fetchMock} />);

    expect(screen.getByText("Say-Do Ratio")).toBeTruthy();
    const formula = "Formula: (Completed committed points ÷ Committed points at start) × 100";
    const toggle = screen.getByRole("button", { name: "How is the Say-Do Ratio calculated?" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(await screen.findByText(formula)).toBeTruthy();
    expect(await screen.findAllByText("Error Loading Trends")).toHaveLength(2);
    expect(screen.getByText("Points Completed")).toBeTruthy();
    // No sprint range is shown when there is no data to chart.
    expect(screen.queryByText(/^Sprints:/)).toBeNull();
  });

  test("reports when no sprint has dates", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const body = url.includes("/_apis/work/teamsettings/iterations") ? { value: [] } : {};
      return { ok: true, json: async () => body, text: async () => JSON.stringify(body), status: 200, statusText: "OK" } as Response;
    });
    renderInProviders(<TrendsTab {...tabProps} fetchFn={fetchMock} />);

    expect(await screen.findAllByText("No Sprints With Dates")).toHaveLength(2);
  });
});
