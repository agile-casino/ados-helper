import { useEffect, useState } from "react";
import { getIteration } from "../api/iterationsRepository";
import { getWorkItemDetails, getWorkItems, WorkItemDetailsDto } from "../api/workItemsRepository";
import { WorkItemTable } from "./WorkItemTable";
import { WorkItemChart } from "./WorkItemChart";

export interface ReportDialogProps {
    collection: string;
    project: string;
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {

    const [workItems, setWorkItems] = useState<WorkItemDetailsDto[]>([]);

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
            <div className="ui-dialog workitem-dialog ui-dialog-legacy full-screen" style={{ zIndex: 10002 }}>
                <div className="ui-dialog-titlebar">
                    <button type="button" className="ui-button ui-button-icon-only ui-dialog-titlebar-close" onClick={props.onCloseClicked}>
                        <span className="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    </button>
                </div>
                <div className="work-item-form-main-header" style={{ borderLeftColor: "rgb(0, 156, 204)" }}>
                    <div className="info-text-wrapper" style={{ fontSize: "large", padding: "0.5em" }}>{props.team} {props.sprint} Reports</div>
                </div>
                <div style={{ float: "left" }}>
                    <WorkItemTable title="Work" workItems={workItems} />
                </div>
                <div style={{ float: "right", position: "relative", height: "300px", width: "400px" }}>
                    <WorkItemChart workItems={workItems} />
                </div>
            </div>
        );
    }
    else {
        return null;
    }
};
