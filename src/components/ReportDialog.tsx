import { useEffect, useState } from "react";
import uniq from "lodash/uniq";
import sum from "lodash/sum";
import { Pie } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import { getIteration } from "../api/iterationsRepository";
import { getWorkItemDetails, getWorkItems, WorkItemDetailsDto } from "../api/workItemsRepository";
import { css } from "@emotion/react";
import "chart.js/auto";

const tableStyle = css(`
    margin: 1em;
    display: inline-block;

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

export interface ReportDialogProps {
    collection: string;
    project: string;
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {

    const [workItems, setWorkItems] = useState<WorkItemDetailsDto[]>();

    async function updateIteration() {
        const iteration = await getIteration(props.collection, props.project, props.team, props.sprint);
        if (iteration) {
            const workItems = await getWorkItems(props.collection, props.project, props.team, iteration.id);
            const workItemIds = workItems.workItemRelations.filter(x => !x.source).map(w => w.target.id);
            const workItemDetails = await getWorkItemDetails(props.collection, props.project, workItemIds);
            setWorkItems(workItemDetails);
        }
    }

    useEffect(() => {
        updateIteration().catch(console.error);
    }, [props.collection, props.project, props.team, props.sprint]);

    const people = uniq(workItems?.map(x => x.fields["System.AssignedTo"]?.displayName));
    const points = people.map(x => sum(workItems?.filter(y => y.fields["System.AssignedTo"]?.displayName === x).map(z => z.fields["Microsoft.VSTS.Scheduling.Effort"])));

    const chartData: ChartData<"pie", number[], string> = {
        labels: people,
        datasets: [{
          data: points,
          backgroundColor: [
            'rgb(255,  99, 132)',
            'rgb(54,  162, 235)',
            'rgb(255, 205, 86)',
            'rgb(128, 128, 128)'
          ]
        }]
      };

    const chartOptions: ChartOptions<"pie"> = { 
        animation: { 
            duration: 0
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right"
            }
        }
    };

    if (props.open) {
        return (
            <div className="ui-dialog workitem-dialog ui-dialog-legacy full-screen" style={{ zIndex: 10002 }}>
                <div className="ui-dialog-titlebar">
                    <button type="button" className="ui-button ui-button-icon-only ui-dialog-titlebar-close" onClick={props.onCloseClicked}>
                        <span className="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    </button>
                </div>
                <div className="work-item-form-main-header" style={{ borderLeftColor: "rgb(0, 156, 204)" }}>
                    <div className="info-text-wrapper" style={{ fontSize: "large", padding: "0.5em" }}>{props.team} {props.sprint} Reports</div>
                </div>
                <div css={tableStyle}>
                    <h2>Done</h2>
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
                                workItems && workItems.filter(x => x.fields["System.State"] === "Done").map(x => (
                                    <tr>
                                        <td>{x.id}</td>
                                        <td></td>
                                        <td>{x.fields["System.Title"]}</td>
                                        <td>{x.fields["System.AssignedTo"]?.displayName}</td>
                                        <td>{x.fields["Microsoft.VSTS.Scheduling.Effort"]}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                <div style={{ float: "right", position: "relative", height: "300px", width: "400px" }}>
                    <Pie data={chartData} options={chartOptions} />
                </div>
            </div>
        );
    }
    else {
        return null;
    }
};
