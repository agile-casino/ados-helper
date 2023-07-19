import sumBy from "lodash/sumBy";
import { css } from "@emotion/react";
import { WorkItem } from "../domain/WorkItem";
import { formatName } from "../utils/formatName";
import { If } from "./If";
import { WorkItemCollection } from "../domain/WorkItemCollection";


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

    const workItemCollection = new WorkItemCollection(workItems);

    return (
        <div css={tableStyle}>
            <table>
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
            </table>
        </div>
    );
}

function WorkItemTableHeader({ title }: { title: string }) {
    return (
        <thead>
            <tr>
                <th className="section" colSpan={7}>{title}</th>
            </tr>
            <tr>
                <th style={{ textAlign: "center" }}>PBI</th>
                <th style={{ textAlign: "center" }}>WISE</th>
                <th style={{ textAlign: "left" }}>Tags</th>
                <th style={{ textAlign: "left" }}>Description</th>
                <th style={{ textAlign: "left" }}>Assignee</th>
                <th style={{ textAlign: "center" }}>Size</th>
                <th style={{ textAlign: "left" }}>Remaining Work</th>
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

                    const description = getDescription(x.title);

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
                            <td>{description.tags}</td>
                            <td>{description.title}</td>
                            <td>{formatName(x.owner)}</td>
                            <td style={{ textAlign: "center" }}>{x.effort}</td>
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

function getDescription(title: string) {
    const match = title.match(/^\[(?<tag>.+?)\](?<title>.+)$/);
    if (match && match.groups) {
        const tags = (match.groups["tag"] ?? "").replace(" | ", ", ");
        return { tags: tags, title: match.groups["title"] };
    }
    else {
        return { tags: "", title: title };
    }
}
