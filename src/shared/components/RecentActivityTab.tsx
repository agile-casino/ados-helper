import { Alert, Badge, Button, Group, Loader, NumberInput, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { iterationQueryKey, recentActivityQueryKey } from "../api/queryKeys";
import type { WorkItemUpdate } from "../api/schemas";
import { usePlatform } from "../context/PlatformContext";
import { useSettings } from "../context/SettingsContext";
import { type ActivityTone, buildRecentActivity, collectIdsToFetch, type PbiActivity } from "../domain/recentActivity";
import { clampLookbackHours, loadLookbackHours, MAX_LOOKBACK_HOURS, MIN_LOOKBACK_HOURS, saveLookbackHours } from "../settings/lookbackStorage";

interface RecentActivityTabProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
  fetchFn?: typeof globalThis.fetch;
}

const PRESETS = [
  { label: "12h", hours: 12 },
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 }
];

const FETCH_CONCURRENCY = 10;

const toneColor: Record<ActivityTone, string> = { positive: "green", negative: "red", neutral: "gray" };

const describeWindow = (hours: number): string => {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "24 hours" : `${days} days`;
  }
  return `${hours} hours`;
};

const formatWhen = (date: Date): string => date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

async function fetchUpdates(apiClient: ApiClient, collection: string, project: string, ids: number[]): Promise<Record<number, WorkItemUpdate[]>> {
  const result: Record<number, WorkItemUpdate[]> = {};
  for (let i = 0; i < ids.length; i += FETCH_CONCURRENCY) {
    const chunk = ids.slice(i, i + FETCH_CONCURRENCY);
    const updates = await Promise.all(chunk.map(id => apiClient.getWorkItemUpdates(collection, project, id)));
    chunk.forEach((id, index) => {
      result[id] = updates[index] ?? [];
    });
  }
  return result;
}

export const RecentActivityTab = (props: RecentActivityTabProps) => {
  const platform = usePlatform();
  const { stateConfig } = useSettings();
  const configKey = JSON.stringify(stateConfig.states);
  const enabled = Boolean(props.collection && props.project && props.team && props.sprint);
  const [lookbackHours, setLookbackHours] = useState(() => loadLookbackHours(props.collection, props.project));

  const changeLookback = (value: number | string) => {
    if (value === "" || typeof value === "string") return;
    const hours = clampLookbackHours(value);
    setLookbackHours(hours);
    saveLookbackHours(props.collection, props.project, hours);
  };

  // Shares its cache entry with the Current Team tab, but is always revalidated on
  // mount: this tab is about what just changed, so the app-wide 5 minute staleTime
  // would hide tasks added since the sprint was cached.
  const iteration = useQuery({
    queryKey: iterationQueryKey(props.origin, props.collection, props.project, props.team, props.iterationPath, configKey),
    enabled,
    staleTime: 0,
    queryFn: () => new ApiClient(props.origin, props.fetchFn, stateConfig).getIteration2(props.collection, props.project, props.team, props.iterationPath)
  });

  const workItems = iteration.data?.workItems;

  const activity = useQuery({
    // dataUpdatedAt ties the result to the sprint snapshot it was computed from.
    queryKey: [...recentActivityQueryKey(props.origin, props.collection, props.project, props.team, props.iterationPath, lookbackHours, configKey), iteration.dataUpdatedAt],
    // Wait for any revalidation so updates aren't fetched for a stale item list.
    enabled: enabled && workItems !== undefined && !iteration.isFetching,
    staleTime: 0,
    queryFn: async (): Promise<{ items: PbiActivity[]; until: Date }> => {
      const items = workItems ?? [];
      const until = new Date();
      const since = new Date(until.getTime() - lookbackHours * 60 * 60 * 1000);
      const apiClient = new ApiClient(props.origin, props.fetchFn, stateConfig);
      const updatesById = await fetchUpdates(apiClient, props.collection, props.project, collectIdsToFetch(items, since));
      return { items: buildRecentActivity(items, updatesById, since, until, stateConfig), until };
    }
  });

  const itemUrl = (id: number) => `${props.origin}/${props.collection}/${props.project}/_workitems/edit/${id}`;

  const error = iteration.error ?? activity.error;
  const refreshing = iteration.isFetching || activity.isFetching;
  const loading = (iteration.isPending || activity.isPending || (refreshing && !activity.data)) && enabled && !error;
  const items = activity.data?.items ?? [];

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0 1em 1em" }}>
      <Group gap="xs" mb="md" align="flex-end" wrap="wrap">
        <Text size="sm" fw={500}>
          Show changes from the last
        </Text>
        {PRESETS.map(preset => (
          <Button key={preset.hours} size="compact-sm" variant={lookbackHours === preset.hours ? "filled" : "default"} onClick={() => changeLookback(preset.hours)}>
            {preset.label}
          </Button>
        ))}
        <Button size="compact-sm" variant="subtle" loading={refreshing} onClick={() => iteration.refetch()}>
          Refresh
        </Button>
        <NumberInput aria-label="Custom lookback in hours" size="xs" w={110} min={MIN_LOOKBACK_HOURS} max={MAX_LOOKBACK_HOURS} allowDecimal={false} suffix=" hours" value={lookbackHours} onChange={changeLookback} />
      </Group>

      {error ? (
        <Alert color="red" title="Error Loading Recent Activity">
          {error instanceof Error ? error.message : "An unknown error occurred while fetching recent activity."}
        </Alert>
      ) : loading ? (
        <Group justify="center" align="center" style={{ minHeight: "200px" }}>
          <Loader size="lg" />
          <Text size="md" c="dimmed">
            Loading Recent Activity...
          </Text>
        </Group>
      ) : items.length === 0 ? (
        <Alert color="blue" title="No changes">
          No work item changes in the last {describeWindow(lookbackHours)}.
        </Alert>
      ) : (
        <Stack gap="sm">
          {items.map(item => (
            <div key={item.id} style={{ borderBottom: "1px solid var(--mantine-color-default-border)", paddingBottom: "0.5rem" }}>
              <Group justify="space-between" wrap="nowrap" align="baseline">
                <Text fw={600} size="sm">
                  <a href={itemUrl(item.id)} target="_blank" rel="noopener noreferrer" onClick={e => platform.openExternalLink(itemUrl(item.id), e)}>
                    {item.workItemType === "Bug" ? "Bug" : "PBI"} {item.id}
                  </a>
                  : {item.title}
                </Text>
                <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                  {formatWhen(item.lastActivity)}
                </Text>
              </Group>
              <Group gap="xs" mt={4}>
                {item.lines.map(line => (
                  <Badge key={line.text} color={toneColor[line.tone]} variant="light" tt="none" fw={500}>
                    {line.text}
                  </Badge>
                ))}
              </Group>
            </div>
          ))}
        </Stack>
      )}
    </div>
  );
};
