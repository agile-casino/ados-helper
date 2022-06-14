import sortBy from "lodash/sortBy";
import sumBy from "lodash/sumBy";
import { css } from "@emotion/react";
import { WorkItem } from "../domain/WorkItem";
import { formatName } from "../utils/formatName";
import { If } from "./If";


const tableStyle = css(`
    margin: 1em;
    margin-top: 0;

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
            padding-left: 0;
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
    origin: string;
    collection: string;
    project: string;
    workItems?: WorkItem[];
}

export function WorkItemTable({ origin, collection, project, workItems }: WorkItemTableProps) {

    if (!workItems) {
        return null;
    }

    const doneWorkItems = sortBy(workItems?.filter(workItem => workItem.isDone), x => x.title);
    const inProgressWorkitems = sortBy(workItems?.filter(workItem => workItem.isInProgress && !workItem.isRemoved), x => x.title);
    const notStartedWorkItems = sortBy(workItems?.filter(workItem => !workItem.isInProgress && !workItem.isDone && !workItem.isRemoved), x => x.title);
    const removedWorkItems = sortBy(workItems?.filter(workItem => workItem.isRemoved), x => x.title);

    return (
        <div css={tableStyle}>
            <table>
                <If condition={!!doneWorkItems.length}>
                    <WorkItemTableHeader title={`Done - ${sumBy(doneWorkItems, x => x.effort)} points`} />
                    <WorkItemTableBody origin={origin} workItems={doneWorkItems} collection={collection} project={project} />
                </If>
                <If condition={!!inProgressWorkitems.length}>
                    <WorkItemTableHeader title={`In Progress - ${sumBy(inProgressWorkitems, x => x.effort)} points`} />
                    <WorkItemTableBody origin={origin} workItems={inProgressWorkitems} collection={collection} project={project} />
                </If>
                <If condition={!!notStartedWorkItems.length}>
                    <WorkItemTableHeader title={`Not Started - ${sumBy(notStartedWorkItems, x => x.effort)} points`} />
                    <WorkItemTableBody origin={origin} workItems={notStartedWorkItems} collection={collection} project={project} />
                </If>
                <If condition={!!removedWorkItems.length}>
                    <WorkItemTableHeader title={`Removed - ${sumBy(removedWorkItems, x => x.effort)} points`} />
                    <WorkItemTableBody origin={origin} workItems={removedWorkItems} collection={collection} project={project} />
                </If>
            </table>
        </div>
    );
}

function WorkItemTableHeader({ title }: { title: string }) {
    return (
        <thead>
            <tr>
                <th className="section" colSpan={6}>{title}</th>
            </tr>
            <tr>
                <th>PBI</th>
                <th>WISE</th>
                <th>Description</th>
                <th>Assignee</th>
                <th>Size</th>
                <th>Remaining Work</th>
            </tr>
        </thead>
    );
}

function WorkItemTableBody({ origin, collection, project, workItems }: { origin: string, collection: string, project: string, workItems: WorkItem[] }) {
    return (
        <tbody>
            {
                workItems.length ? workItems.map(x => {
                    const style: React.CSSProperties = {};
                    
                    if (x.sprint?.sprintNumber && x.sprintTag?.sprintNumber) {
                        if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "+") {
                            style.backgroundColor = "#F4F785";
                        }
                        else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber && x.sprintTag.sprintSuffix === "!") {
                            style.backgroundColor = "#FFCC66";
                        }
                        else if (x.sprintTag.sprintNumber === x.sprint.sprintNumber - 1 && x.sprintTag.sprintSuffix !== "+") {
                            style.backgroundColor = "#E6B8B7";
                        }
                    }

                    if (x.allTasksDone) {
                        style.fontWeight = "bold";
                    }

                    return (
                        <tr key={x.id}>
                            <td style={style}>
                                <a href={`${origin}/${collection}/${project}/_workitems/edit/${x.id}`}>{x.id}</a>
                            </td>
                            <td>
                                {
                                    x.wiseNumber
                                        ? <a href={x.wiseLink}>{x.wiseNumber}</a>
                                        : null
                                }
                            </td>
                            <td>{x.title}</td>
                            <td>{formatName(x.owner)}</td>
                            <td>{x.effort}</td>
                            <td>
                                {
                                    x.remainingWork
                                        ? `${x.remainingWork} hours`
                                        : null
                                }
                            </td>
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
