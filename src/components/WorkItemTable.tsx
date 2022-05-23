import sortBy from "lodash/sortBy";
import { css } from "@emotion/react";
import { WorkItem } from "../domain/WorkItem";
import { formatName } from "../utils/formatName";
import { If } from "./If";

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
    collection: string;
    project: string;
    workItems?: WorkItem[];
}

export function WorkItemTable({ collection, project, workItems }: WorkItemTableProps) {

    if (!workItems) {
        return null;
    }

    const doneWorkItems = sortBy(workItems?.filter(workItem => workItem.isDone), x => x.title);
    const inProgressWorkitems = sortBy(workItems?.filter(workItem => workItem.isInProgress), x => x.title);
    const notStartedWorkItems = sortBy(workItems?.filter(workItem => !workItem.isInProgress && !workItem.isDone), x => x.title);

    return (
        <div css={tableStyle}>
            <table>
                <If condition={!!doneWorkItems.length}>
                    <WorkItemTableHeader title="Done" />
                    <WorkItemTableBody workItems={doneWorkItems} collection={collection} project={project} />
                </If>
                <If condition={!!inProgressWorkitems.length}>
                    <WorkItemTableHeader title="In Progress" />
                    <WorkItemTableBody workItems={inProgressWorkitems} collection={collection} project={project} />
                </If>
                <If condition={!!notStartedWorkItems.length}>
                    <WorkItemTableHeader title="Not Started" />
                    <WorkItemTableBody workItems={notStartedWorkItems} collection={collection} project={project} />
                </If>
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

function WorkItemTableBody({ collection, project, workItems }: { collection: string, project: string, workItems: WorkItem[] }) {
    return (
        <tbody>
            {
                workItems.length ? workItems.map(x => {
                    const style: React.CSSProperties = {};
                    
                    if (x.sprint?.sprintNumber && x.sprintTag?.sprintNumber) {
                        if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "+") {
                            style.backgroundColor = "#F4F785";
                        }
                        else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber - 1 && x.sprintTag.sprintSuffix !== "+") {
                            style.backgroundColor = "#E6B8B7";
                        }
                    }

                    return (
                        <tr key={x.id}>
                            <td style={style}>
                                <a href={`${window.location.origin}/${collection}/${project}/_workitems/edit/${x.id}`}>{x.id}</a>
                                
                            </td>
                            <td>{x.title}</td>
                            <td>{formatName(x.owner)}</td>
                            <td>{x.effort}</td>
                        </tr>
                    )
                }) : (
                    <tr>
                        <td colSpan={5}>No work items found</td>
                    </tr>
                )
            }
        </tbody>
    );
}
