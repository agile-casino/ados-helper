import { css } from "@emotion/react";
import { WorkItemDto } from "../api/queryRepository";
import { WorkItemDetailsDto } from "../api/workItemsRepository";
import { formatName } from "../utils/formatName";

const tableStyle = css(`
    margin: 1em;

    h2 {
        margin-bottom: 0.25m;
    }

    table {
        border: 1px solid silver;

        th {
            padding: 0.1em 0.5em;
            border-left: 1px solid silver;
            border-bottom: 1px solid silver;
        }
    
        td {
            padding: 0.1em 0.5em;
            border-left: 1px solid silver;
        }
    }
`);

interface  WorkItemTableProps {
    title: string;
    workItems?: WorkItemDto[];
}

export function WorkItemTable({ title, workItems }: WorkItemTableProps) {
    return (
        <div css={tableStyle}>
            <h2>{title}</h2>
            <table>
                <thead>
                    <tr>
                        <th>PBI</th>
                        <th>Description</th>
                        <th>Assignee</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        workItems && workItems.map(x => (
                            <tr key={x.System.Id}>
                                <td>{x.System.Id}</td>
                                <td>{x.System.Title}</td>
                                <td>{formatName(x.System.AssignedTo)}</td>
                                <td>{x.Microsoft.VSTS.Scheduling.Effort}</td>
                            </tr>
                        ))
                    }
                    {
                        !workItems && (
                            <tr>
                                <td colSpan={5}>No work items found</td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    );
}
