import { useEffect, useState } from "react";
import { WorkItemTable } from "./WorkItemTable";
import { WorkItemChart } from "./WorkItemChart";
import { QueryClient } from "../api/query/QueryClient";
import { generateReport } from "../domain/reports/ReportGenerator";
import { WorkItem } from "../domain/WorkItem";
import { If } from "./If";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import { ApiClient } from "../api/ApiClient";
import { Button, Dialog, Title } from "@mantine/core";

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
            <Dialog opened={true} w={1000} h={650} withCloseButton={true} onClose={props.onCloseClicked}>
                <Title order={4} fw={400} style={{ marginBottom: "1rem" }}>
                    <span>{props.team} {props.sprint} Reports</span>
                </Title>
                <div style={{ maxHeight: "calc(100% - 42px)", overflowY: "scroll" }}>
                    <div style={{ float: "left" }}>
                        <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} />
                        <Button style={{ marginLeft: "1em", marginBottom: "1em" }} onClick={() => generateReport(origin, props.collection, props.project, props.team, props.sprint, workItems)}>Generate Report</Button>
                    </div>
                    <If condition={!!window.localStorage.getItem("debug")}>
                        <div style={{ float: "right", position: "relative", height: "300px", width: "400px" }}>
                            <WorkItemChart workItems={workItems} />
                        </div>
                    </If>
                </div>
            </Dialog>
        );
    }
    else {
        return null;
    }
};
