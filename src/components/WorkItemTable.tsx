import { Table } from "@mantine/core";
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
}

export function WorkItemTable({ origin, collection, project, workItems }: WorkItemTableProps) {
  if (!workItems) {
    return null;
  }

  const workItemCollection = new WorkItemCollection(workItems);

  return (
    <div className={styles.workItemTable}>
      <Table>
        <If condition={!!workItemCollection.done.length}>
          <WorkItemTableHeader title={`Done - ${sumBy(workItemCollection.done, x => x.effort)} points`} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.done} collection={collection} project={project} />
        </If>
        <If condition={!!workItemCollection.inProgress.length}>
          <WorkItemTableHeader title={`In Progress - ${sumBy(workItemCollection.inProgress, x => x.effort)} points`} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.inProgress} collection={collection} project={project} />
        </If>
        <If condition={!!workItemCollection.notStarted.length}>
          <WorkItemTableHeader title={`Not Started - ${sumBy(workItemCollection.notStarted, x => x.effort)} points`} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.notStarted} collection={collection} project={project} />
        </If>
        <If condition={!!workItemCollection.removed.length}>
          <WorkItemTableHeader title={`Removed - ${sumBy(workItemCollection.removed, x => x.effort)} points`} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.removed} collection={collection} project={project} />
        </If>
        <If condition={!!workItemCollection.studyTime.length}>
          <WorkItemTableHeader title={"Study Time"} />
          <WorkItemTableBody origin={origin} workItems={workItemCollection.studyTime} collection={collection} project={project} />
        </If>
      </Table>
    </div>
  );
}

function WorkItemTableHeader({ title }: { title: string }) {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th className={styles.section} colSpan={7}>
          {title}
        </Table.Th>
      </Table.Tr>
      <Table.Tr>
        <Table.Th style={{ textAlign: "center" }}>PBI</Table.Th>
        <Table.Th style={{ textAlign: "center" }}>WISE</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Tags</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Description</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Assignee</Table.Th>
        <Table.Th style={{ textAlign: "center" }}>Size</Table.Th>
        <Table.Th style={{ textAlign: "left" }}>Remaining Work</Table.Th>
      </Table.Tr>
    </Table.Thead>
  );
}

function WorkItemTableBody({ origin, collection, project, workItems }: { origin: string; collection: string; project: string; workItems: WorkItem[] }) {
  return (
    <Table.Tbody>
      {workItems.length ? (
        workItems.map(x => {
          const style: React.CSSProperties = {};

          if (x.sprint?.sprintNumber && x.sprintTag?.sprintNumber) {
            if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "+") {
              style.backgroundColor = "#F4F785";
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "!") {
              style.backgroundColor = "#FFCC66";
            } else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber - 1 && x.sprintTag.sprintSuffix !== "+") {
              style.backgroundColor = "#E6B8B7";
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
              <Table.Td>{x.wiseNumber ? <a href={x.wiseLink}>{x.wiseNumber}</a> : null}</Table.Td>
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
          <Table.Td colSpan={5}>No work items found</Table.Td>
        </Table.Tr>
      )}
    </Table.Tbody>
  );
}

function getDescription(title: string) {
  const match = title.match(/^\[(?<tag>.+?)\](?<title>.+)$/);
  if (match?.groups) {
    const tags = (match.groups.tag ?? "").replace(" | ", ", ");
    return { tags: tags, title: match.groups.title };
  } else {
    return { tags: "", title: title };
  }
}
