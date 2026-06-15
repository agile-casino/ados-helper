import { Badge, Table } from "@mantine/core";
import sumBy from "lodash/sumBy";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemCollection } from "../domain/WorkItemCollection";
import { formatName } from "../utils/formatName";
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
    <div
      style={{
        padding: "1rem",
        marginBottom: "1rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        flexWrap: "wrap"
      }}
    >
      <div>
        <strong>Sprint Statistics</strong>
      </div>
      <div>
        <div style={{ fontSize: "0.875rem", color: "#666" }}>Completed Items</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          {completedCommitted.length} / {committedItems.length}
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.875rem", color: "#666" }}>Completed Points</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          {collection.completedCommittedEffort} / {collection.committedEffort}
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.875rem", color: "#666" }}>Achievement</div>
        <Badge size="xl" color={getColor(percentage)} style={{ fontSize: "1.25rem" }}>
          {percentage}%
        </Badge>
      </div>
      <If condition={pulledInItems.length > 0}>
        <div>
          <div style={{ fontSize: "0.875rem", color: "#666" }}>Pulled In Later</div>
          <div style={{ fontSize: "1rem" }}>
            {pulledInItems.length} items ({collection.pulledInEffort} pts)
          </div>
        </div>
      </If>
    </div>
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
  return (
    <Table.Tbody>
      {workItems.length ? (
        workItems.map(x => {
          const style: React.CSSProperties = {};

          // Tag-based color coding for yellow and orange
          if (x.sprint?.sprintNumber && x.sprintTag?.sprintNumber) {
            if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "+") {
              style.backgroundColor = "#eeece1";
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "!") {
              style.backgroundColor = "#FFCC66";
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber - 1 && x.sprintTag.sprintSuffix !== "+") {
              style.backgroundColor = "#f2dcdb";
            }
          }

          // Date-based color coding (only if no tag-based color applied)
          if (!style.backgroundColor && sprintStartDate) {
            // Yellow for PBIs pulled in late (activated > 2 days after sprint start)
            if (x.isPulledInLate(sprintStartDate)) {
              style.backgroundColor = "#eeece1";
            }
            // Pink for PBIs activated before sprint start
            else if (x.activatedDate && x.activatedDate < sprintStartDate) {
              style.backgroundColor = "#f2dcdb";
            }
          }

          if (x.allTasksDone) {
            style.fontWeight = "bold";
          }

          const description = getDescription(x.title);

          return (
            <Table.Tr key={x.id}>
              <Table.Td style={style}>
                <a href={`${origin}/${collection}/${project}/_workitems/edit/${x.id}`}>{x.id}</a>
              </Table.Td>
              {showWiseColumn && <Table.Td>{x.wiseNumber ? <a href={x.wiseLink}>{x.wiseNumber}</a> : null}</Table.Td>}
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
