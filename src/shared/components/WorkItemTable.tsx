import { Group, Table, Text, useMantineColorScheme } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import sumBy from "lodash/sumBy";
import type { SayDoSummary } from "../api/useSprintSayDo";
import { usePlatform } from "../context/PlatformContext";
import { getRowHighlight, ROW_HIGHLIGHT_ORDER, ROW_HIGHLIGHT_STYLES, type RowHighlight } from "../domain/rowHighlight";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemCollection } from "../domain/WorkItemCollection";
import { formatName } from "../utils/formatName";
import { SprintStatisticsSummary } from "./SprintStatisticsSummary";
import styles from "./WorkItemTable.module.css";

interface WorkItemTableProps {
  origin: string;
  collection: string;
  project: string;
  workItems?: WorkItem[];
  sprintStartDate?: Date | undefined;
  sprintEndDate?: Date | undefined;
  /** When given, the summary shows the Say-Do Ratio instead of Achievement. */
  sayDo?: SayDoSummary | undefined;
}

function useIsDarkMode() {
  const { colorScheme } = useMantineColorScheme();
  const systemColorScheme = useColorScheme();
  return colorScheme === "auto" ? systemColorScheme === "dark" : colorScheme === "dark";
}

function HighlightLegend({ highlights }: { highlights: RowHighlight[] }) {
  const isDark = useIsDarkMode();
  const shown = ROW_HIGHLIGHT_ORDER.filter(h => highlights.includes(h));
  if (shown.length === 0) {
    return null;
  }

  return (
    <Group gap="lg" mb="md" aria-label="Row colour key">
      <Text size="sm" fw={600} c="dimmed">
        Key
      </Text>
      {shown.map(h => (
        <Group key={h} gap="xs" wrap="nowrap">
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 16, height: 16, borderRadius: 3, border: "1px solid var(--mantine-color-default-border)", background: isDark ? ROW_HIGHLIGHT_STYLES[h].darkColor : ROW_HIGHLIGHT_STYLES[h].color }}
          />
          <Text size="sm">{ROW_HIGHLIGHT_STYLES[h].label}</Text>
        </Group>
      ))}
    </Group>
  );
}

export function WorkItemTable({ origin, collection, project, workItems, sprintStartDate, sprintEndDate, sayDo }: WorkItemTableProps) {
  if (!workItems) {
    return null;
  }

  const workItemCollection = new WorkItemCollection(workItems, sprintStartDate, sprintEndDate);
  // Only the highlights present in this table are shown in the key.
  const highlights = [...new Set(workItems.map(x => getRowHighlight(x, sprintStartDate)))].filter((h): h is RowHighlight => h !== null);
  const showWiseColumn = workItems.some(x => x.wiseNumber !== undefined);

  return (
    <div className={styles.workItemTable}>
      <SprintStatisticsSummary collection={workItemCollection} sayDo={sayDo} />
      <HighlightLegend highlights={highlights} />
      <Table>
        {workItemCollection.done.length > 0 && (
          <>
            <WorkItemTableHeader title={`Done - ${sumBy(workItemCollection.done, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
            <WorkItemTableBody origin={origin} workItems={workItemCollection.done} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
          </>
        )}
        {workItemCollection.inProgress.length > 0 && (
          <>
            <WorkItemTableHeader title={`In Progress - ${sumBy(workItemCollection.inProgress, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
            <WorkItemTableBody origin={origin} workItems={workItemCollection.inProgress} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
          </>
        )}
        {workItemCollection.notStarted.length > 0 && (
          <>
            <WorkItemTableHeader title={`Not Started - ${sumBy(workItemCollection.notStarted, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
            <WorkItemTableBody origin={origin} workItems={workItemCollection.notStarted} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
          </>
        )}
        {workItemCollection.removed.length > 0 && (
          <>
            <WorkItemTableHeader title={`Removed - ${sumBy(workItemCollection.removed, x => x.effort)} points`} showWiseColumn={showWiseColumn} />
            <WorkItemTableBody origin={origin} workItems={workItemCollection.removed} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
          </>
        )}
        {workItemCollection.studyTime.length > 0 && (
          <>
            <WorkItemTableHeader title={"Study Time"} showWiseColumn={showWiseColumn} />
            <WorkItemTableBody origin={origin} workItems={workItemCollection.studyTime} collection={collection} project={project} sprintStartDate={sprintStartDate} showWiseColumn={showWiseColumn} />
          </>
        )}
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
  const platform = usePlatform();
  const isDark = useIsDarkMode();

  return (
    <Table.Tbody>
      {workItems.length ? (
        workItems.map(x => {
          const style: React.CSSProperties = {};
          const highlight = getRowHighlight(x, sprintStartDate);
          if (highlight) {
            style.backgroundColor = isDark ? ROW_HIGHLIGHT_STYLES[highlight].darkColor : ROW_HIGHLIGHT_STYLES[highlight].color;
          }

          if (x.allTasksDone) {
            style.fontWeight = "bold";
          }

          const description = getDescription(x.title);

          return (
            <Table.Tr key={x.id}>
              <Table.Td style={style}>
                <a href={`${origin}/${collection}/${project}/_workitems/edit/${x.id}`} target="_blank" rel="noopener noreferrer" onClick={e => platform.openExternalLink(`${origin}/${collection}/${project}/_workitems/edit/${x.id}`, e)}>
                  {x.id}
                </a>
              </Table.Td>
              {showWiseColumn && (
                <Table.Td>
                  {x.wiseNumber ? (
                    <a href={x.wiseLink} target="_blank" rel="noopener noreferrer" onClick={e => x.wiseLink && platform.openExternalLink(x.wiseLink, e)}>
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
