import { useEffect, useState } from "preact/hooks";
import { getIteration, IterationDto } from "../api/iterationsRepository";
import { getWorkItems, WorkItemsDto } from "../api/workItemsRepository";

export interface ReportDialogProps {
    collection: string;
    project: string;
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {

    const [workItems, setWorkItems] = useState<WorkItemsDto>();

    async function updateIteration() {
        const iteration = await getIteration(props.collection, props.project, props.team, props.sprint);
        if (iteration) {
            const workItems = await getWorkItems(props.collection, props.project, props.team, iteration.id);
            setWorkItems(workItems);
        }
    }

    useEffect(() => {
        updateIteration().catch(console.error);
    }, [props.collection, props.project, props.team]);

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
                <ul>
                    {
                        workItems && workItems.workItemRelations.filter(x => !x.source).map(x => (
                            <li>{x.target.id}</li>
                        ))
                    }
                </ul>
            </div>
        );
    }
    else {
        return null;
    }
};
