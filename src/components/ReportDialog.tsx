import { useEffect, useState } from "preact/hooks";
import { getIteration } from "../api/iterationsRepository";
import { getWorkItemDetails, getWorkItems, WorkItemDetailsDto } from "../api/workItemsRepository";

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
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        );
    }
    else {
        return null;
    }
};
