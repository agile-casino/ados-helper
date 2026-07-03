import { Alert, Badge, Box, Card, Group, Loader, Paper, RingProgress, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { QueryClient } from "../api/query/QueryClient";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import { usePlatform } from "../context/PlatformContext";
import type { WorkItem } from "../domain/WorkItem";

interface WorkItemFieldUpdate<T = string> {
  oldValue?: T;
  newValue?: T;
}

interface WorkItemUpdate {
  id: number;
  rev: number;
  revisedDate: string;
  fields?: {
    "System.IterationPath"?: WorkItemFieldUpdate;
    "System.State"?: WorkItemFieldUpdate;
  };
}

interface SprintStatsTabProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
}

const normalizeIterationPath = (path: string, project: string) => {
  let p = path.replace(/\//g, "\\");
  const prefix = `${project}\\`.toLowerCase().replace(/\//g, "\\");
  if (p.toLowerCase().startsWith(prefix)) {
    p = p.slice(prefix.length);
  }
  return p;
};

const calculateCompletedPoints = (items: WorkItem[]) => {
  const active = items.filter(w => w.state !== "Removed" && w.sprintTag?.sprintSuffix !== "-");
  const completed = active.filter(w => w.isDone);
  return completed.reduce((sum, w) => sum + (w.effort || 0), 0);
};

const calculateStdev = (values: number[], mean: number): number => {
  if (values.length <= 1) return 0;
  const sumSquaredDiffs = values.reduce((sum, val) => sum + (val - mean) ** 2, 0);
  return Math.sqrt(sumSquaredDiffs / (values.length - 1));
};

const getActiveItems = (items: WorkItem[]) => {
  return items.filter(w => w.state !== "Removed" && w.sprintTag?.sprintSuffix !== "-");
};

export const SprintStatsTab = (props: SprintStatsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [committedDate, setCommittedDate] = useState<Date | null>(null);
  const [snapshotEndDate, setSnapshotEndDate] = useState<Date | null>(null);
  const [initialItems, setInitialItems] = useState<WorkItem[]>([]);
  const [finalItems, setFinalItems] = useState<WorkItem[]>([]);
  const [prevSprintsData, setPrevSprintsData] = useState<{ name: string; completedPoints: number }[]>([]);
  const [transitionDates, setTransitionDates] = useState<Record<number, Date | null>>({});
  const platform = usePlatform();

  useEffect(() => {
    let active = true;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const workItemClient = new WorkItemClient(props.origin);
        const queryClient = new QueryClient(props.origin, workItemClient);
        const apiClient = new ApiClient(props.origin, queryClient, workItemClient);

        // 1. Fetch dates
        const sprintName = props.project === "WirelineRnD" ? props.sprint : (props.iterationPath.split("/").pop() ?? props.sprint);
        const iterDates = await apiClient.getIterationDates(props.collection, props.project, props.team, sprintName);

        if (!iterDates.startDate || !iterDates.finishDate) {
          if (active) {
            setDates({});
            setLoading(false);
          }
          return;
        }

        const start = new Date(iterDates.startDate);
        const finish = new Date(iterDates.finishDate);

        if (active) {
          setDates({ startDate: start, endDate: finish });
        }

        // 2. Calculate snapshot dates
        // Committed Date = startDate + 1 day (end of Day 2)
        const commitDate = new Date(start.getTime() + 1 * 24 * 60 * 60 * 1000);
        commitDate.setUTCHours(23, 59, 59, 999);

        // Snapshot End Date = finishDate - 1 day (end of day before last)
        const endSnapDate = new Date(finish.getTime() - 1 * 24 * 60 * 60 * 1000);
        endSnapDate.setUTCHours(23, 59, 59, 999);

        // If sprint is in progress, use current date/time as the final snapshot date
        const now = new Date();
        const actualEndDate = now < endSnapDate ? now : endSnapDate;

        if (active) {
          setCommittedDate(commitDate);
          setSnapshotEndDate(actualEndDate);
        }

        // 3. Fetch snapshots and iterations list in parallel
        const [initialResult, finalResult, allIterations] = await Promise.all([
          apiClient.getSprintSnapshot(props.collection, props.project, props.team, props.sprint, props.iterationPath, commitDate),
          apiClient.getSprintSnapshot(props.collection, props.project, props.team, props.sprint, props.iterationPath, actualEndDate),
          apiClient.getIterations(props.collection, props.project, props.team)
        ]);

        // 4. Filter and sort iterations to find the previous 6 sprints
        const iterationsWithDates = allIterations.filter(iter => iter.attributes?.startDate && iter.attributes?.finishDate);
        const sortedIterations = [...iterationsWithDates].sort((a, b) => {
          const aDate = a.attributes?.startDate;
          const bDate = b.attributes?.startDate;
          if (!aDate || !bDate) return 0;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        });

        const currentIndex = sortedIterations.findIndex(iter => iter.name === props.sprint || iter.path.endsWith(props.sprint));
        const previousSprints = currentIndex !== -1 ? sortedIterations.slice(Math.max(0, currentIndex - 6), currentIndex) : [];

        // 5. Fetch completed points for previous sprints in parallel
        const historyData = await Promise.all(
          previousSprints.map(async s => {
            const sFinishDate = s.attributes?.finishDate;
            const sFinish = sFinishDate ? new Date(sFinishDate) : new Date();
            const sEndSnapDate = new Date(sFinish.getTime() - 1 * 24 * 60 * 60 * 1000);
            sEndSnapDate.setUTCHours(23, 59, 59, 999);

            const normPath = normalizeIterationPath(s.path, props.project);
            const sItems = await apiClient.getSprintSnapshot(props.collection, props.project, props.team, s.name, normPath, sEndSnapDate);

            const completedPoints = calculateCompletedPoints(sItems);
            return {
              name: s.name,
              completedPoints
            };
          })
        );

        // Calculate added and removed items to fetch transition dates
        const initialActive = getActiveItems(initialResult);
        const finalActive = getActiveItems(finalResult);
        const removedItems = initialActive.filter(i => !finalActive.some(f => f.id === i.id));
        const addedItems = finalActive.filter(f => !initialActive.some(i => i.id === f.id));

        const itemIdsToFetch = [...new Set([...addedItems.map(i => i.id), ...removedItems.map(i => i.id)])];
        const updatesResults = await Promise.all(
          itemIdsToFetch.map(async id => {
            const updates = (await apiClient.getWorkItemUpdates(props.collection, props.project, id)) as WorkItemUpdate[];
            return { id, updates };
          })
        );

        const newTransitionDates: Record<number, Date | null> = {};
        const sprintPathLower = props.iterationPath.toLowerCase().replace(/\//g, "\\");

        const isItemInSprint = (path: string) => {
          const normalized = path.toLowerCase().replace(/\//g, "\\");
          return normalized === sprintPathLower || normalized.endsWith(`\\${sprintPathLower}`);
        };

        for (const { id, updates } of updatesResults) {
          const isAdded = addedItems.some(i => i.id === id);
          let transitionDate: Date | null = null;

          if (isAdded) {
            for (const u of updates) {
              const iterField = u.fields?.["System.IterationPath"];
              if (iterField?.newValue && isItemInSprint(iterField.newValue)) {
                transitionDate = new Date(u.revisedDate);
                break;
              }
            }
            const firstUpdate = updates[0];
            if (!transitionDate && firstUpdate) {
              transitionDate = new Date(firstUpdate.revisedDate);
            }
          } else {
            for (const u of updates) {
              const iterField = u.fields?.["System.IterationPath"];
              if (iterField?.oldValue && isItemInSprint(iterField.oldValue) && (!iterField.newValue || !isItemInSprint(iterField.newValue))) {
                transitionDate = new Date(u.revisedDate);
              }
              const stateField = u.fields?.["System.State"];
              if (stateField?.newValue === "Removed") {
                transitionDate = new Date(u.revisedDate);
              }
            }
            const lastUpdate = updates[updates.length - 1];
            if (!transitionDate && lastUpdate) {
              transitionDate = new Date(lastUpdate.revisedDate);
            }
          }

          newTransitionDates[id] = transitionDate;
        }

        if (active) {
          setInitialItems(initialResult);
          setFinalItems(finalResult);
          setPrevSprintsData(historyData);
          setTransitionDates(newTransitionDates);
          setLoading(false);
        }
      } catch (e: unknown) {
        console.error("Failed to fetch sprint snapshots:", e);
        if (active) {
          setError(e instanceof Error ? e.message : "An unknown error occurred while fetching sprint stats.");
          setLoading(false);
        }
      }
    }

    fetchStats().catch(console.error);

    return () => {
      active = false;
    };
  }, [props.collection, props.project, props.team, props.sprint, props.iterationPath, props.origin]);

  if (loading) {
    return (
      <Group justify="center" align="center" style={{ height: "100%", minHeight: "200px" }}>
        <Loader size="lg" />
        <Text size="md" c="dimmed">
          Loading Snapshots...
        </Text>
      </Group>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error Loading Stats" m="md">
        {error}
      </Alert>
    );
  }

  if (!dates.startDate || !dates.endDate) {
    return (
      <Alert color="yellow" title="Dates Not Set" m="md">
        Iteration start and end dates are not configured in Azure DevOps for sprint "{props.sprint}". Please set iteration dates in ADOS to enable Sprint Stats.
      </Alert>
    );
  }

  const initialActive = getActiveItems(initialItems);
  const finalActive = getActiveItems(finalItems);

  // 1. Committed Stats
  const committedPoints = initialActive.reduce((sum, w) => sum + (w.effort || 0), 0);
  const committedCount = initialActive.length;

  // 2. Removed Stats
  const removedItems = initialActive.filter(i => !finalActive.some(f => f.id === i.id));
  const removedPoints = removedItems.reduce((sum, w) => sum + (w.effort || 0), 0);
  const removedCount = removedItems.length;

  // 3. Added Stats
  const addedItems = finalActive.filter(f => !initialActive.some(i => i.id === f.id));
  const addedPoints = addedItems.reduce((sum, w) => sum + (w.effort || 0), 0);
  const addedCount = addedItems.length;

  // 4. Completed Stats
  const completedItems = finalActive.filter(w => w.isDone);
  const completedPoints = completedItems.reduce((sum, w) => sum + (w.effort || 0), 0);
  const completedCount = completedItems.length;

  // 5. Say-Do (Predictability) Calculation
  const completedCommittedItems = completedItems.filter(c => initialActive.some(i => i.id === c.id));
  const completedCommittedPoints = completedCommittedItems.reduce((sum, w) => sum + (w.effort || 0), 0);
  const completedCommittedCount = completedCommittedItems.length;
  const sayDoPct = committedPoints > 0 ? Math.round((completedCommittedPoints / committedPoints) * 100) : 0;

  // 6. Churn Calculation
  const churnPct = committedPoints > 0 ? Math.round(((addedPoints + removedPoints) / committedPoints) * 100) : 0;

  // 7. Velocity History Calculations
  const previousSprintsCount = prevSprintsData.length;
  const averageVelocity = previousSprintsCount > 0 ? prevSprintsData.reduce((sum, s) => sum + s.completedPoints, 0) / previousSprintsCount : 0;

  const prevCompletedPointsList = prevSprintsData.map(s => s.completedPoints);
  const stdevVelocity = calculateStdev(prevCompletedPointsList, averageVelocity);
  const velocityVariance = averageVelocity > 0 ? (stdevVelocity / averageVelocity) * 100 : 0;

  // Visual cues for Churn
  const getChurnColor = (pct: number) => {
    if (pct < 15) return "green";
    if (pct < 35) return "yellow";
    return "red";
  };

  // Visual cues for Say-Do
  const getSayDoColor = (pct: number) => {
    if (pct >= 90) return "green";
    if (pct >= 70) return "yellow";
    return "red";
  };

  const formatLocalDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px" }}>
      <Stack gap="md">
        {/* Date Ranges Information Banner */}
        <Paper withBorder p="sm" bg="var(--mantine-color-gray-light)">
          <Group justify="space-between">
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>
                Sprint Date Range
              </Text>
              <Text size="sm" fw={600}>
                {formatLocalDate(dates.startDate)} – {formatLocalDate(dates.endDate)}
              </Text>
            </div>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>
                Committed Snapshot Date
              </Text>
              <Text size="sm" fw={600}>
                {committedDate ? formatLocalDate(committedDate) : "N/A"}
              </Text>
            </div>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>
                Final Snapshot Date
              </Text>
              <Text size="sm" fw={600}>
                {snapshotEndDate ? formatLocalDate(snapshotEndDate) : "N/A"}
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Say-Do and Churn RingProgress Row */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* Main Say-Do Ratio RingProgress */}
          <Card withBorder style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" fw={600} c="dimmed">
                  Say-Do Ratio
                </Text>
                <Title order={2} style={{ fontSize: "2rem" }}>
                  {sayDoPct}%
                </Title>
                <Badge size="md" color={getSayDoColor(sayDoPct)}>
                  {sayDoPct < 70 ? "Low Reliability" : sayDoPct < 90 ? "Moderate Reliability" : "High Reliability"}
                </Badge>
                <Text size="xs" c="dimmed" style={{ marginTop: "4px" }}>
                  {completedCommittedPoints} of {committedPoints} committed pts ({completedCommittedCount} items)
                </Text>
              </Stack>
              <RingProgress
                size={110}
                thickness={10}
                roundCaps={true}
                sections={[{ value: Math.min(sayDoPct, 100), color: getSayDoColor(sayDoPct) }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    {sayDoPct}%
                  </Text>
                }
              />
            </Group>
          </Card>

          {/* Main Churn RingProgress */}
          <Card withBorder style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" fw={600} c="dimmed">
                  Sprint Churn
                </Text>
                <Title order={2} style={{ fontSize: "2rem" }}>
                  {churnPct}%
                </Title>
                <Badge size="md" color={getChurnColor(churnPct)}>
                  {churnPct < 15 ? "Healthy Commit" : churnPct < 35 ? "Moderate Churn" : "High Churn"}
                </Badge>
              </Stack>
              <RingProgress
                size={110}
                thickness={10}
                roundCaps={true}
                sections={[{ value: Math.min(churnPct, 100), color: getChurnColor(churnPct) }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    {churnPct}%
                  </Text>
                }
              />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Primary Metrics Grid */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {/* Committed Stats Card */}
          <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Text size="sm" fw={600} c="dimmed">
              Committed Points
            </Text>
            <div>
              <Title order={3}>{committedPoints} pts</Title>
              <Text size="xs" c="dimmed">
                {committedCount} work items at start
              </Text>
            </div>
          </Card>

          {/* Completed Stats Card */}
          <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Text size="sm" fw={600} c="dimmed">
              Completed Points
            </Text>
            <div>
              <Title order={3} c="green">
                {completedPoints} pts
              </Title>
              <Text size="xs" c="dimmed">
                {completedCount} work items completed
              </Text>
            </div>
          </Card>

          {/* Churn Breakdown summary */}
          <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Text size="sm" fw={600} c="dimmed">
              Net Change Details
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs">Added after start:</Text>
                <Text size="xs" fw={700} c="green">
                  +{addedPoints} pts ({addedCount})
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs">Removed/Dropped:</Text>
                <Text size="xs" fw={700} c="red">
                  -{removedPoints} pts ({removedCount})
                </Text>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Velocity History (Last 6 Sprints) */}
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Text size="sm" fw={600} c="dimmed">
                Average Velocity
              </Text>
              <div>
                <Title order={3}>{averageVelocity.toFixed(1)} pts</Title>
                <Text size="xs" c="dimmed">
                  Average completed points over last {previousSprintsCount} sprints
                </Text>
              </div>
            </Card>

            <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Text size="sm" fw={600} c="dimmed">
                Velocity Variance
              </Text>
              <div>
                <Title order={3}>{velocityVariance.toFixed(1)}%</Title>
                <Text size="xs" c="dimmed">
                  Consistency metric (STDEV / Average Velocity × 100)
                </Text>
              </div>
            </Card>
          </SimpleGrid>

          <Card withBorder p="md" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Text size="sm" fw={600} c="dimmed" mb="xs">
              Completed Points by Sprint
            </Text>
            {prevSprintsData.length > 0 ? (
              <Group gap="sm" grow>
                {prevSprintsData.map(s => (
                  <Box p="xs" key={s.name} style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {s.name}
                    </Text>
                    <Text size="lg" fw={700} c="blue">
                      {s.completedPoints}
                    </Text>
                    <Text size="xs" c="dimmed">
                      pts
                    </Text>
                  </Box>
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed" ta="center" style={{ margin: "1rem 0" }}>
                No previous sprint data available.
              </Text>
            )}
          </Card>
        </Stack>

        {/* Detailed Lists of Added and Removed Items */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* Added Items List */}
          <Paper withBorder p="md" style={{ display: "flex", flexDirection: "column" }}>
            <Title order={5} style={{ marginBottom: "1rem" }} c="green">
              Added to Sprint after Start ({addedCount} items, {addedPoints} pts)
            </Title>
            {addedItems.length > 0 ? (
              <Table highlightOnHover={true}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={80}>ID</Table.Th>
                    <Table.Th>Title</Table.Th>
                    <Table.Th w={120}>Date Added</Table.Th>
                    <Table.Th w={80} style={{ textAlign: "center" }}>
                      Points
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {addedItems.map(item => {
                    const transDate = transitionDates[item.id];
                    return (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <a
                            href={`${props.origin}/${props.collection}/${props.project}/_workitems/edit/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => platform.openExternalLink(`${props.origin}/${props.collection}/${props.project}/_workitems/edit/${item.id}`, e)}
                          >
                            {item.id}
                          </a>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {item.title}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {transDate ? formatLocalDate(transDate) : "N/A"}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: "center" }}>
                          <Badge variant="light" color="blue">
                            {item.effort || 0}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed" ta="center" style={{ margin: "2rem 0" }}>
                No items were added after the sprint started.
              </Text>
            )}
          </Paper>

          {/* Removed Items List */}
          <Paper withBorder p="md" style={{ display: "flex", flexDirection: "column" }}>
            <Title order={5} style={{ marginBottom: "1rem" }} c="red">
              Removed/Dropped from Sprint ({removedCount} items, {removedPoints} pts)
            </Title>
            {removedItems.length > 0 ? (
              <Table highlightOnHover={true}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={80}>ID</Table.Th>
                    <Table.Th>Title</Table.Th>
                    <Table.Th w={120}>Date Removed</Table.Th>
                    <Table.Th w={80} style={{ textAlign: "center" }}>
                      Points
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {removedItems.map(item => {
                    const transDate = transitionDates[item.id];
                    return (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <a
                            href={`${props.origin}/${props.collection}/${props.project}/_workitems/edit/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => platform.openExternalLink(`${props.origin}/${props.collection}/${props.project}/_workitems/edit/${item.id}`, e)}
                          >
                            {item.id}
                          </a>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {item.title}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {transDate ? formatLocalDate(transDate) : "N/A"}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: "center" }}>
                          <Badge variant="light" color="gray">
                            {item.effort || 0}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed" ta="center" style={{ margin: "2rem 0" }}>
                No items were removed after the sprint started.
              </Text>
            )}
          </Paper>
        </SimpleGrid>
      </Stack>
    </div>
  );
};
