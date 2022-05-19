import { useEffect, useState } from "react";
import { WorkItemTable } from "./WorkItemTable";
import { WorkItemChart } from "./WorkItemChart";
import { RunQuery, WorkItemDto } from "../api/queryRepository";
import { generateReport } from "./ReportGenerator";

export interface ReportDialogProps {
    collection: string;
    project: string;
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {

    const [workItems, setWorkItems] = useState<WorkItemDto[]>([]);

    async function updateIteration() {
        if (props.collection && props.project && props.team && props.sprint) {
            const query = "SELECT [System.Id],[System.WorkItemType],[System.Title],[System.AssignedTo],[System.State],[System.Tags],[Microsoft.VSTS.Scheduling.Effort] "
                        + "FROM WorkItemLinks "
                        + "WHERE ([Source].[System.TeamProject] = @project "
                        + "  AND [Source].[System.WorkItemType] = 'Product Backlog Item' "
                        + `  AND [Source].[System.IterationPath] = '${props.project}\\${props.team}\\${props.sprint}') `
                        + "  AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') "
                        + "  AND ([Target].[System.TeamProject] = @project AND [Target].[System.WorkItemType] <> '') "
                        + "  mode(Recursive)";

            const queryResult = await RunQuery(props.collection, props.project, props.team, query);
            setWorkItems(queryResult);
        }
    }

    useEffect(() => {
        updateIteration().catch(console.error);
    }, [props.collection, props.project, props.team, props.sprint]);

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
                <div style={{ float: "left" }}>
                    <WorkItemTable workItems={workItems} />
                    <button style={{ marginLeft: "1em" }} onClick={() => generateReport(props.collection, props.project, props.sprint, workItems)}>Generate Report</button>
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
