import { Button, Dialog, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { QueryClient } from "../api/query/QueryClient";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import { generateReport } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemTable } from "./WorkItemTable";

interface ReportDialogProps {
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

  useEffect(() => {
    async function updateIteration() {
      if (props.collection && props.project && props.team && props.sprint) {
        const workItemClient = new WorkItemClient(origin);
        const queryClient = new QueryClient(origin, workItemClient);
        const apiClient = new ApiClient(queryClient, workItemClient);

        const queryResult = props.project === "WirelineRnD" ? await apiClient.getIteration(props.collection, props.project, props.team, props.sprint) : await apiClient.getIteration2(props.collection, props.project, props.team, props.sprint);

        setWorkItems(queryResult);
      }
    }
    updateIteration().catch((e: unknown) => console.error(e));
  }, [props.collection, props.project, props.team, props.sprint]);

  if (props.open) {
    return (
      <Dialog opened={true} w={1000} h={650} withCloseButton={true} onClose={props.onCloseClicked}>
        <Title order={4} fw={400} style={{ marginBottom: "1rem" }}>
          <span>
            {props.team} {props.sprint} Reports
          </span>
        </Title>
        <div style={{ maxHeight: "calc(100% - 42px)", overflowY: "scroll" }}>
          <div style={{ float: "left" }}>
            <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} />
            <Button style={{ marginLeft: "1em", marginBottom: "1em" }} onClick={() => generateReport(origin, props.collection, props.project, props.team, props.sprint, workItems)}>
              Generate Report
            </Button>
          </div>
        </div>
      </Dialog>
    );
  } else {
    return null;
  }
};
