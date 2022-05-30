import { useEffect, useState } from "react";
import { WorkItemTable } from "./WorkItemTable";
import { WorkItemChart } from "./WorkItemChart";
import { QueryClient } from "../api/query/QueryClient";
import { generateReport } from "../domain/reports/ReportGenerator";
import { WorkItem } from "../domain/WorkItem";
import { If } from "./If";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import { ApiClient } from "../api/ApiClient";

export interface ReportDialogProps {
    origin: string;
    collection: string;
    project: string;
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {

    const [workItems, setWorkItems] = useState<WorkItem[]>([]);

    async function updateIteration() {
        if (props.collection && props.project && props.team && props.sprint) {
            const workItemClient = new WorkItemClient(origin);
            const queryClient = new QueryClient(origin, workItemClient);
            const apiClient = new ApiClient(queryClient, workItemClient);

            const queryResult = await apiClient.getIteration(props.collection, props.project, props.team, props.sprint);

            setWorkItems(queryResult);
        }
    }

    useEffect(() => {
        updateIteration().catch(console.error);
    }, [props.collection, props.project, props.team, props.sprint, props.open]);

    if (props.open) {
        return (
            <div className="ui-dialog workitem-dialog ui-dialog-legacy full-screen" style={{ zIndex: 10002 }}>
                <div className="ui-dialog-titlebar">
                    <button type="button" className="ui-button ui-button-icon-only ui-dialog-titlebar-close" style={{ margin: "0.5em" }} onClick={props.onCloseClicked}>
                        <span className="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    </button>
                </div>
                <div className="work-item-form-main-header" style={{ borderLeftColor: "rgb(0, 156, 204)", borderBottom: "1px solid rgb(234, 234, 234)" }}>
                    <div className="info-text-wrapper" style={{ fontSize: "large", padding: "0.5em" }}>{props.team} {props.sprint} Reports</div>
                </div>
                <div style={{ maxHeight: "calc(100% - 42px)", overflowY: "scroll" }}>
                    <div style={{ float: "left" }}>
                        <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} />
                        <button style={{ marginLeft: "1em", marginBottom: "1em" }} onClick={() => generateReport(origin, props.collection, props.project, props.team, props.sprint, workItems)}>Generate Report</button>
                    </div>
                    <If condition={!!window.localStorage.getItem("debug")}>
                        <div style={{ float: "right", position: "relative", height: "300px", width: "400px" }}>
                            <WorkItemChart workItems={workItems} />
                        </div>
                    </If>
                </div>
            </div>
        );
    }
    else {
        return null;
    }
};
