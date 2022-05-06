import { css } from "@emotion/react";
import { WorkItemDetailsDto } from "../api/workItemsRepository";

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
    workItems?: WorkItemDetailsDto[];
}

export function WorkItemTable({ title, workItems }: WorkItemTableProps) {
    return (
        <div css={tableStyle}>
            <h2>{title}</h2>
            <table>
                <thead>
                    <tr>
                        <th>PBI</th>
                        <th>WQ/SDR</th>
                        <th>Description</th>
                        <th>Assignee</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        workItems && workItems.map(x => (
                            <tr key={x.id}>
                                <td>{x.id}</td>
                                <td></td>
                                <td>{x.fields["System.Title"]}</td>
                                <td>{x.fields["System.AssignedTo"]?.displayName}</td>
                                <td>{x.fields["Microsoft.VSTS.Scheduling.Effort"]}</td>
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
