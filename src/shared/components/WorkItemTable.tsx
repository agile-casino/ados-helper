import { Badge, Paper, Table, Text, useMantineColorScheme } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import sumBy from "lodash/sumBy";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemCollection } from "../domain/WorkItemCollection";
import { formatName } from "../utils/formatName";
import { openExternalLink } from "../utils/openExternalLink";
import { If } from "./If";
import styles from "./WorkItemTable.module.css";

interface WorkItemTableProps {
  origin: string;
  collection: string;
  project: string;
  workItems?: WorkItem[];
  sprintStartDate?: Date | undefined;
  sprintEndDate?: Date | undefined;
}

function StatisticsSummary({ collection }: { collection: WorkItemCollection }) {
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
        <Text size="sm" c="dimmed">
          Achievement
        </Text>
        <Badge size="xl" color={getColor(percentage)} style={{ fontSize: "1.25rem" }}>
          {percentage}%
        </Badge>
      </div>
      <If condition={pulledInItems.length > 0}>
        <div>
          <Text size="sm" c="dimmed">
            Pulled In Later
          </Text>
          <Text size="md">
            {pulledInItems.length} items ({collection.pulledInEffort} pts)
          </Text>
        </div>
      </If>
    </Paper>
  );
}

export function WorkItemTable({ origin, collection, project, workItems, sprintStartDate, sprintEndDate }: WorkItemTableProps) {
  if (!workItems) {
    return null;
  }

  const workItemCollection = new WorkItemCollection(workItems, sprintStartDate, sprintEndDate);
  const showWiseColumn = workItems.some(x => x.wiseNumber !== undefined);

  return (
    <div className={styles.workItemTable}>
      <StatisticsSummary collection={workItemCollection} />
      <Table>
        <If condition={!!workItemCollection.done.length}>
          <WorkItemTableHeader title={`Done - ${sumBy(workItemCollection.done, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.done} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
        </If>
        <If condition={!!workItemCollection.inProgress.length}>
          <WorkItemTableHeader title={`In Progress - ${sumBy(workItemCollection.inProgress, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.inProgress} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
        </If>
        <If condition={!!workItemCollection.notStarted.length}>
          <WorkItemTableHeader title={`Not Started - ${sumBy(workItemCollection.notStarted, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.notStarted} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
        </If>
        <If condition={!!workItemCollection.removed.length}>
          <WorkItemTableHeader title={`Removed - ${sumBy(workItemCollection.removed, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.removed} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
        </If>
        <If condition={!!workItemCollection.studyTime.length}>
          <WorkItemTableHeader title={"Study Time"} showWiseColumn={showWiseColumn} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.studyTime} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
        </If>
      </Table>
    </div>
  );
}

function WorkItemTableHeader({ title, showWiseColumn }: { title: string; showWiseColumn: boolean }) {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th className={styles.section} colSpan={showWiseColumn ? 7 : 6}>
          {title}
        </Table.Th>
      </Table.Tr>
      <Table.Tr>
        <Table.Th style={{ textAlign: "center" }}>PBI</Table.Th>
        {showWiseColumn && <Table.Th style={{ textAlign: "center" }}>WISE</Table.Th>}
        <Table.Th style={{ textAlign: "left" }}>Tags</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Description</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Assignee</Table.Th>
        <Table.Th style={{ textAlign: "center" }}>Size</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Remaining Work</Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
}

function WorkItemTableBody({ origin, collection, project, workItems, sprintStartDate, showWiseColumn }: { origin: string; collection: string; project: string; workItems: WorkItem[]; sprintStartDate?: Date | undefined; showWiseColumn: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const systemColorScheme = useColorScheme();
  const isDark = colorScheme === "auto" ? systemColorScheme === "dark" : colorScheme === "dark";

  const bgYellow = isDark ? "rgba(230, 200, 50, 0.18)" : "#eeece1";
  const bgOrange = isDark ? "rgba(255, 150, 0, 0.28)" : "#FFCC66";
  const bgPink = isDark ? "rgba(240, 100, 100, 0.22)" : "#f2dcdb";

  return (
    <Table.Tbody>
      {workItems.length ? (
        workItems.map(x => {
          const style: React.CSSProperties = {};

          // Tag-based color coding for yellow and orange
          if (x.sprint?.sprintNumber && x.sprintTag?.sprintNumber) {
            if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "+") {
              style.backgroundColor = bgYellow;
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "!") {
              style.backgroundColor = bgOrange;
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber - 1 && x.sprintTag.sprintSuffix !== "+") {
              style.backgroundColor = bgPink;
            }
          }

          // Date-based color coding (only if no tag-based color applied)
          if (!style.backgroundColor && sprintStartDate) {
            // Yellow for PBIs pulled in late (activated > 2 days after sprint start)
            if (x.isPulledInLate(sprintStartDate)) {
              style.backgroundColor = bgYellow;
            }
            // Pink for PBIs activated > 2 days before sprint start
            else if (x.isActivatedEarly(sprintStartDate)) {
              style.backgroundColor = bgPink;
            }
          }

          if (x.allTasksDone) {
            style.fontWeight = "bold";
          }

          const description = getDescription(x.title);

          return (
            <Table.Tr key={x.id}>
              <Table.Td style={style}>
                <a href={`${origin}/${collection}/${project}/_workitems/edit/${x.id}`} target="_blank" rel="noopener noreferrer" onClick={e => openExternalLink(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`, e)}>
                  {x.id}
                </a>
              </Table.Td>
              {showWiseColumn && (
                <Table.Td>
                  {x.wiseNumber ? (
                    <a href={x.wiseLink} target="_blank" rel="noopener noreferrer" onClick={e => x.wiseLink && openExternalLink(x.wiseLink, e)}>
                      {x.wiseNumber}
                    </a>
                  ) : null}
                </Table.Td>
              )}
              <Table.Td>{description.tags}</Table.Td>
              <Table.Td>{description.title}</Table.Td>
              <Table.Td>{formatName(x.owner)}</Table.Td>
              <Table.Td style={{ textAlign: "center" }}>{x.effort}</Table.Td>
              <Table.Td>{x.remainingWork ? `${x.remainingWork} hours` : null}</Table.Td>
            </Table.Tr>
          );
        })
      ) : (
        <Table.Tr>
          <Table.Td colSpan={showWiseColumn ? 7 : 6}>No work items found</Table.Td>
        </Table.Tr>
      )}
    </Table.Tbody>
  );
}

function getDescription(title: string) {
  const match = title.match(/^\[(?<tag>.+?)\](?<title>.+)$/);
  if (match?.groups) {
    const tags = (match.groups["tag"] ?? "").replace(" | ", ", ");
    return { tags: tags, title: match.groups["title"] ?? "" };
  } else {
    return { tags: "", title: title };
  }
}
