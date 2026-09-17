import { Alert, Badge, Button, Group, Loader, Paper, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { workItemStatesQueryKey } from "../api/queryKeys";
import { useSettings } from "../context/SettingsContext";
import { KNOWN_PBI_STATES, WORK_ITEM_CATEGORIES, type WorkItemCategory } from "../domain/WorkItemState";

interface SettingsTabProps {
  origin: string;
  collection: string;
  project: string;
  fetchFn?: typeof globalThis.fetch;
}

const categoryData = WORK_ITEM_CATEGORIES.map(category => ({ value: category, label: category }));

const HIDDEN_STATES = new Set(["New", "Ready", "Approved"]);

export const SettingsTab = ({ origin, collection, project, fetchFn }: SettingsTabProps) => {
  const { stateConfig, setStateConfig, resetStateConfig } = useSettings();
  const [newState, setNewState] = useState("");

  const statesQuery = useQuery({
    queryKey: workItemStatesQueryKey(origin, collection, project),
    enabled: Boolean(collection && project),
    queryFn: () => new ApiClient(origin, fetchFn).getWorkItemStates(collection, project)
  });

  const fetchedStateNames = (statesQuery.data ?? []).map(state => state.name);
  const allStates = [...new Set<string>([...KNOWN_PBI_STATES, ...fetchedStateNames, ...Object.keys(stateConfig.states)])].filter(state => !HIDDEN_STATES.has(state)).sort((a, b) => a.localeCompare(b));

  const updateCategory = (state: string, category: WorkItemCategory) => {
    setStateConfig({ states: { ...stateConfig.states, [state]: category } });
  };

  const handleAddState = () => {
    const trimmed = newState.trim();
    if (!trimmed) return;
    if (!stateConfig.states[trimmed]) {
      updateCategory(trimmed, "Not Started");
    }
    setNewState("");
  };

  const handleReset = () => {
    if (window.confirm("Reset all state mappings to the defaults?")) {
      resetStateConfig();
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px" }}>
      <Stack gap="md">
        <div>
          <Title order={4}>Work Item State Mapping</Title>
          <Text size="sm" c="dimmed">
            Map each Azure DevOps state to a report category.
          </Text>
        </div>

        {statesQuery.isError && (
          <Alert color="yellow" title="Could not load states">
            Failed to load the work item states from Azure DevOps.
          </Alert>
        )}

        {statesQuery.isPending ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        ) : (
          <Paper withBorder p="md">
            <Stack gap="xs">
              {allStates.map(state => (
                <Group key={state} justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <Text size="sm">{state}</Text>
                    {!KNOWN_PBI_STATES.includes(state as (typeof KNOWN_PBI_STATES)[number]) && (
                      <Badge size="xs" variant="light" color="gray">
                        Custom
                      </Badge>
                    )}
                  </Group>
                  <Select aria-label={`Category for ${state}`} data={categoryData} value={stateConfig.states[state] ?? "Not Started"} onChange={value => value && updateCategory(state, value as WorkItemCategory)} allowDeselect={false} />
                </Group>
              ))}
            </Stack>
          </Paper>
        )}

        <div>
          <Text size="sm" fw={500} mb="xs">
            Add custom state:
          </Text>
          <Group gap="xs">
            <TextInput
              value={newState}
              onChange={e => setNewState(e.currentTarget.value)}
              placeholder="e.g. In Review"
              onKeyDown={e => {
                if (e.key === "Enter") handleAddState();
              }}
            />
            <Button onClick={handleAddState}>Add</Button>
          </Group>
        </div>

        <Group>
          <Button color="red" variant="outline" onClick={handleReset}>
            Reset to defaults
          </Button>
        </Group>
      </Stack>
    </div>
  );
};
