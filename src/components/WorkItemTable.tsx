import { css } from "@emotion/react";
import { WorkItem } from "../domain/WorkItem";
import { formatName } from "../utils/formatName";

const tableStyle = css(`
    margin: 1em;

    h2 {
        margin-bottom: 0.25m;
    }

    table {

        th {
            padding: 0.1em 0.5em;
            border-left: 1px solid silver;
            border-right: 1px solid silver;
            border-bottom: 1px solid silver;
        }

        th.section {
            font-size: 1.2em;
            text-align: left;
            border-left: none;
            border-right: none;
            padding-top: 1em;
            padding-bottom: 0.5em;
        }
    
        td {
            padding: 0.1em 0.5em;
            border-left: 1px solid silver;
            border-right: 1px solid silver;
        }

        tbody {
            border-bottom: 1px solid silver;
        }
    }
`);

interface  WorkItemTableProps {
    workItems?: WorkItem[];
}

export function WorkItemTable({ workItems }: WorkItemTableProps) {

    if (!workItems) {
        return null;
    }

    const doneWorkItems = workItems?.filter(workItem => workItem.isDone);
    const inProgressWorkitems = workItems?.filter(workItem => workItem.isInProgress);
    const notStartedWorkItems = workItems?.filter(workItem => !workItem.isInProgress && !workItem.isDone);

    return (
        <div css={tableStyle}>
            <table>
                <WorkItemTableHeader title="Done" />
                <WorkItemTableBody workItems={doneWorkItems} />
                <WorkItemTableHeader title="In Progress" />
                <WorkItemTableBody workItems={inProgressWorkitems} />
                <WorkItemTableHeader title="Not Started" />
                <WorkItemTableBody workItems={notStartedWorkItems} />
            </table>
        </div>
    );
}

function WorkItemTableHeader({ title }: { title: string }) {
    return (
        <thead>
            <tr>
                <th className="section" colSpan={4}>{title}</th>
            </tr>
            <tr>
                <th>PBI</th>
                <th>Description</th>
                <th>Assignee</th>
                <th>Size</th>
            </tr>
        </thead>
    );
}

function WorkItemTableBody({ workItems }: { workItems: WorkItem[] }) {
    return (
        <tbody>
            {
                workItems.length ? workItems.map(x => (
                    <tr key={x.id}>
                        <td>{x.id}</td>
                        <td>{x.title}</td>
                        <td>{formatName(x.assignedTo)}</td>
                        <td>{x.effort}</td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={5}>No work items found</td>
                    </tr>
                )
            }
        </tbody>
    );
}
