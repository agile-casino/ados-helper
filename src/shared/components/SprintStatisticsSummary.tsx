import { Badge, Loader, Paper, Text, Tooltip } from "@mantine/core";
import type { SayDoSummary } from "../api/useSprintSayDo";
import type { WorkItemCollection } from "../domain/WorkItemCollection";

/**
 * Headline numbers for a set of work items: completed items and points, then either the
 * Say-Do Ratio (when `sayDo` is given) or Achievement, then pulled-in work.
 */
const getSayDoColor = (pct: number | null) => {
  if (pct === null) return "gray";
  if (pct >= 90) return "green";
  if (pct >= 70) return "yellow";
  return "red";
};

function SayDoBadge({ sayDo }: { sayDo: SayDoSummary }) {
  if (sayDo.loading) {
    return <Loader size="sm" />;
  }
  return (
    <Badge size="xl" color={getSayDoColor(sayDo.percent)} style={{ fontSize: "1.25rem" }}>
      {sayDo.percent === null ? "N/A" : `${sayDo.percent}%`}
    </Badge>
  );
}

export function SprintStatisticsSummary({ collection, sayDo }: { collection: WorkItemCollection; sayDo?: SayDoSummary | undefined }) {
  const committedItems = collection.committedWorkItems();
  const pulledInItems = collection.pulledInWorkItems();
  const completedCommitted = committedItems.filter(w => w.isDone);
  const percentage = collection.commitmentPercentage;

  const getColor = (pct: number) => {
    if (pct >= 90) return "green";
    if (pct >= 70) return "yellow";
    return "red";
  };

  return (
    <Paper
      withBorder
      p="md"
      mb="md"
      style={{
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        flexWrap: "wrap"
      }}
    >
      <div>
        <Text fw={700}>Sprint Statistics</Text>
      </div>
      <div>
        <Text size="sm" c="dimmed">
          Completed Items
        </Text>
        <Text size="lg" fw={600}>
          {completedCommitted.length} / {committedItems.length}
        </Text>
      </div>
      <div>
        <Text size="sm" c="dimmed">
          Completed Points
        </Text>
        <Text size="lg" fw={600}>
          {collection.completedCommittedEffort} / {collection.committedEffort}
        </Text>
      </div>
      <div>
        {sayDo ? (
          <Tooltip label="Say-Do Ratio: completed committed points divided by committed points at the start of the sprint. Same calculation as the Sprint Stats tab." multiline w={280} withArrow events={{ hover: true, focus: true, touch: true }}>
            <Text size="sm" c="dimmed" style={{ cursor: "help", width: "fit-content" }}>
              Say-Do Ratio
            </Text>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            Achievement
          </Text>
        )}
        {sayDo ? (
          <SayDoBadge sayDo={sayDo} />
        ) : (
          <Badge size="xl" color={getColor(percentage)} style={{ fontSize: "1.25rem" }}>
            {percentage}%
          </Badge>
        )}
      </div>
      {pulledInItems.length > 0 && (
        <div>
          <Text size="sm" c="dimmed">
            Pulled In Later
          </Text>
          <Text size="md">
            {pulledInItems.length} items ({collection.pulledInEffort} pts)
          </Text>
        </div>
      )}
    </Paper>
  );
}
