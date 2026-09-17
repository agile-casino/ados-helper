// @vitest-environment happy-dom

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { DEFAULT_WORK_ITEM_STATE_CONFIG } from "../domain/WorkItemState";
import { SettingsTab } from "./SettingsTab";

const collection = "coll";
const project = "proj";
const storageKey = `sprint-report-generator-state-config-${collection}-${project}`;

function createStatesFetchMock() {
  return vi.fn().mockImplementation(async (url: string) => {
    const respond = (data: unknown) => ({ ok: true, json: async () => data, text: async () => JSON.stringify(data), status: 200, statusText: "OK" }) as Response;
    if (url.includes("workitemtypes/") && url.includes("/states")) {
      return respond({
        value: [
          { name: "In Review", category: "InProgress" },
          { name: "Deployed", category: "Completed" }
        ]
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
}

const Probe = () => {
  const { stateConfig } = useSettings();
  return <div data-testid="probe">{JSON.stringify(stateConfig.states)}</div>;
};

function renderSettings(fetchFn: typeof globalThis.fetch) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider env="test">
        <SettingsProvider collection={collection} project={project}>
          <SettingsTab origin="https://dev.azure.com/org" collection={collection} project={project} fetchFn={fetchFn} />
          <Probe />
        </SettingsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

async function selectCategory(stateName: string, category: string) {
  const input = screen.getByRole("combobox", { name: `Category for ${stateName}` });
  fireEvent.click(input);
  const option = await screen.findByRole("option", { name: category });
  fireEvent.click(option);
}

describe("SettingsTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders fetched and known states, hiding pre-sprint states", async () => {
    renderSettings(createStatesFetchMock());

    expect(await screen.findByRole("combobox", { name: "Category for In Review" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category for Deployed" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category for Removed" })).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Category for New" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Category for Ready" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Category for Approved" })).toBeNull();
  });

  test("changing a category persists it and updates useSettings", async () => {
    renderSettings(createStatesFetchMock());

    await screen.findByRole("combobox", { name: "Category for In Review" });
    await selectCategory("In Review", "In Progress");

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toContain('"In Review":"In Progress"');
    });
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "{}").states["In Review"]).toBe("In Progress");
  });

  test("reset restores the default mapping", async () => {
    localStorage.setItem(storageKey, JSON.stringify({ states: { "In Review": "Done" } }));
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    );

    renderSettings(createStatesFetchMock());

    await screen.findByRole("combobox", { name: "Category for In Review" });
    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toContain('"In Review":"Done"');
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe(JSON.stringify(DEFAULT_WORK_ITEM_STATE_CONFIG.states));
    });
  });
});
