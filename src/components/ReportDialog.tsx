import { useEffect, useState } from "preact/hooks";
import uniq from "lodash/uniq";
import sum from "lodash/sum";
import { Pie } from "react-chartjs-2";
import { getIteration } from "../api/iterationsRepository";
import { getWorkItemDetails, getWorkItems, WorkItemDetailsDto } from "../api/workItemsRepository";
import "chart.js/auto";

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

    const data = {
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

    if (props.open) {
        return (
            <div class="ui-dialog workitem-dialog ui-dialog-legacy full-screen" style={{ zIndex: 10002 }}>
                <div class="ui-dialog-titlebar">
                    <button type="button" class="ui-button ui-button-icon-only ui-dialog-titlebar-close" onClick={props.onCloseClicked}>
                        <span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    </button>
                </div>
                <div class="work-item-form-main-header" style={{ borderLeftColor: "rgb(0, 156, 204)" }}>
                    <div class="info-text-wrapper" style={{ fontSize: "large", padding: "0.5em" }}>{props.team} {props.sprint} Reports</div>
                </div>
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
                <div style={{ width: "300px", height: "300px" }}>
                    <Pie data={data} options={{ animation: { duration: 0 } }} />
                </div>
            </div>
        );
    }
    else {
        return null;
    }
};
