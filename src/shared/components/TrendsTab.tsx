import { Alert, Badge, Card, Group, List, Loader, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiClient } from "../api/ApiClient";
import { sayDoTrendQueryKey } from "../api/queryKeys";
import { useSettings } from "../context/SettingsContext";
import { calculateSayDo, getCommitSnapshotDate, getFinalSnapshotDate, selectTrendSprints } from "../domain/sayDo";
import type { WorkItemStateConfig } from "../domain/WorkItemState";

const TREND_SPRINT_COUNT = 5;

interface TrendsTabProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
  fetchFn?: typeof globalThis.fetch;
}

interface SayDoTrendPoint {
  name: string;
  percent: number | null;
  completedCommittedPoints: number;
  committedPoints: number;
}

const fetchSayDoTrend = async (origin: string, fetchFn: typeof globalThis.fetch | undefined, collection: string, project: string, team: string, sprint: string, iterationPath: string, stateConfig: WorkItemStateConfig): Promise<SayDoTrendPoint[]> => {
  const apiClient = new ApiClient(origin, fetchFn, stateConfig);
  const iterations = await apiClient.getIterations(collection, project, team);
  const sprints = selectTrendSprints(iterations, { name: sprint, path: iterationPath }, project, TREND_SPRINT_COUNT);
  const now = new Date();

  // Each sprint uses the same snapshot dates and Say-Do formula as the Sprint Stats tab.
  return Promise.all(
    sprints.map(async s => {
      const [initialItems, finalItems] = await Promise.all([
        apiClient.getSprintSnapshot(collection, project, team, s.name, s.path, getCommitSnapshotDate(s.startDate)),
        apiClient.getSprintSnapshot(collection, project, team, s.name, s.path, getFinalSnapshotDate(s.finishDate, now))
      ]);
      const result = calculateSayDo(initialItems, finalItems);
      return {
        name: s.name,
        percent: result.percent,
        completedCommittedPoints: result.completedCommittedPoints,
        committedPoints: result.committedPoints
      };
    })
  );
};

// Same reliability bands as the Sprint Stats tab.
const getSayDoColor = (pct: number) => {
  if (pct >= 90) return "var(--mantine-color-green-6)";
  if (pct >= 70) return "var(--mantine-color-yellow-6)";
  return "var(--mantine-color-red-6)";
};

function SayDoExplanationCard() {
  return (
    <Card withBorder p="md" w="100%">
      <Stack gap="sm">
        <Title order={4}>Say-Do Ratio</Title>
        <Text size="sm">The Say-Do Ratio shows how reliably the team finishes the work it commits to. It compares what the team planned at the start of the sprint with what it actually completed by the end.</Text>
        <Text size="sm" fw={600}>
          Formula: (Completed committed points ÷ Committed points at start) × 100
        </Text>
        <List size="sm" spacing="xs">
          <List.Item>
            <Text component="span" size="sm" fw={600}>
              Committed points
            </Text>{" "}
            are the points of active work items in the sprint at the start snapshot (end of Day 2). Items removed from the sprint later still count here, which lowers the ratio.
          </List.Item>
          <List.Item>
            <Text component="span" size="sm" fw={600}>
              Completed committed points
            </Text>{" "}
            are the committed points that are Done by the end of the sprint. Work added after the start snapshot is not counted.
          </List.Item>
          <List.Item>
            <Text component="span" size="sm" fw={600}>
              Sprint in progress
            </Text>{" "}
            is measured up to today.
          </List.Item>
        </List>
        <Group gap="xs">
          <Badge color="green" variant="light">
            90% and above: High Reliability
          </Badge>
          <Badge color="yellow" variant="light">
            70% to 89%: Moderate Reliability
          </Badge>
          <Badge color="red" variant="light">
            Below 70%: Low Reliability
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          A steady, high ratio helps planning, because the team's commitments can be trusted. Read the ratio as a trend across the team's sprints, not as a measure of individual performance.
        </Text>
      </Stack>
    </Card>
  );
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 320;
const MARGIN = { top: 28, right: 24, bottom: 56, left: 48 };
const Y_TICKS = [0, 25, 50, 75, 100];
const THRESHOLDS = [
  { value: 70, label: "70%" },
  { value: 90, label: "90%" }
];

function SayDoTrendChart({ points }: { points: SayDoTrendPoint[] }) {
  const plotWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const bottom = MARGIN.top + plotHeight;

  const xFor = (index: number) => MARGIN.left + (plotWidth * (index + 0.5)) / points.length;
  const yFor = (pct: number) => MARGIN.top + plotHeight * (1 - Math.min(Math.max(pct, 0), 100) / 100);

  // Break the line at sprints with no commitment so a gap is not drawn as a value.
  let path = "";
  let penDown = false;
  points.forEach((p, i) => {
    if (p.percent === null) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"} ${xFor(i)} ${yFor(p.percent)} `;
    penDown = true;
  });

  const summary = points.map(p => `${p.name}: ${p.percent === null ? "no commitment" : `${p.percent}%`}`).join(", ");

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" role="img" aria-label={`Say-Do Ratio trend. ${summary}`} style={{ maxWidth: CHART_WIDTH, display: "block", margin: "0 auto" }}>
      {Y_TICKS.map(tick => (
        <g key={tick}>
          <line x1={MARGIN.left} x2={CHART_WIDTH - MARGIN.right} y1={yFor(tick)} y2={yFor(tick)} style={{ stroke: "var(--mantine-color-default-border)" }} />
          <text x={MARGIN.left - 8} y={yFor(tick)} dy="0.32em" textAnchor="end" style={{ fill: "var(--mantine-color-dimmed)", fontSize: 12 }}>
            {tick}%
          </text>
        </g>
      ))}

      {THRESHOLDS.map(t => (
        <g key={t.value}>
          <line x1={MARGIN.left} x2={CHART_WIDTH - MARGIN.right} y1={yFor(t.value)} y2={yFor(t.value)} strokeDasharray="4 4" style={{ stroke: "var(--mantine-color-dimmed)", opacity: 0.6 }} />
          <text x={CHART_WIDTH - MARGIN.right} y={yFor(t.value) - 6} textAnchor="end" style={{ fill: "var(--mantine-color-dimmed)", fontSize: 11 }}>
            {t.label}
          </text>
        </g>
      ))}

      {path !== "" && <path d={path.trim()} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: "var(--mantine-color-blue-6)" }} />}

      {points.map((p, i) => {
        const x = xFor(i);
        return (
          <g key={p.name}>
            <text x={x} y={bottom + 22} textAnchor="middle" style={{ fill: "var(--mantine-color-text)", fontSize: 13 }}>
              {p.name}
            </text>
            {p.percent === null ? (
              <text x={x} y={bottom - 10} textAnchor="middle" style={{ fill: "var(--mantine-color-dimmed)", fontSize: 12 }}>
                N/A
              </text>
            ) : (
              <>
                <circle cx={x} cy={yFor(p.percent)} r={6} style={{ fill: getSayDoColor(p.percent), stroke: "var(--mantine-color-body)", strokeWidth: 2 }}>
                  <title>{`${p.name}: ${p.percent}% (${p.completedCommittedPoints} of ${p.committedPoints} committed pts)`}</title>
                </circle>
                <text x={x} y={yFor(p.percent) - 12} textAnchor="middle" style={{ fill: "var(--mantine-color-text)", fontSize: 13, fontWeight: 700 }}>
                  {p.percent}%
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const TrendsTab = (props: TrendsTabProps) => {
  const { stateConfig } = useSettings();
  const configKey = JSON.stringify(stateConfig.states);
  const enabled = Boolean(props.collection && props.project && props.team && props.sprint);

  const query = useQuery({
    queryKey: sayDoTrendQueryKey(props.origin, props.collection, props.project, props.team, props.sprint, props.iterationPath, configKey),
    enabled,
    queryFn: () => fetchSayDoTrend(props.origin, props.fetchFn, props.collection, props.project, props.team, props.sprint, props.iterationPath, stateConfig)
  });

  let chart: ReactNode;
  if (query.isPending && enabled) {
    chart = (
      <Group justify="center" align="center" style={{ minHeight: "240px" }}>
        <Loader size="lg" />
        <Text size="md" c="dimmed">
          Loading Say-Do trend...
        </Text>
      </Group>
    );
  } else if (query.error) {
    chart = (
      <Alert color="red" title="Error Loading Trends">
        {query.error instanceof Error ? query.error.message : "An unknown error occurred while fetching the Say-Do trend."}
      </Alert>
    );
  } else if (!query.data || query.data.length === 0) {
    chart = (
      <Alert color="yellow" title="No Sprints With Dates">
        Iteration start and end dates are needed to build the trend. Please set iteration dates in ADOS.
      </Alert>
    );
  } else {
    chart = <SayDoTrendChart points={query.data} />;
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px" }}>
      <Stack gap="md">
        <SayDoExplanationCard />
        <Card withBorder p="md" w="100%">
          <Title order={4} mb="sm">
            Say-Do Ratio: last {TREND_SPRINT_COUNT} sprints
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            The selected sprint and the four sprints before it. Values match the Sprint Stats tab.
          </Text>
          {chart}
        </Card>
      </Stack>
    </div>
  );
};
