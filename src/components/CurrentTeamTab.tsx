import { Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { QueryClient } from "../api/query/QueryClient";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import { generateReport } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemTable } from "./WorkItemTable";

interface CurrentTeamTabProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
}

export const CurrentTeamTab = (props: CurrentTeamTabProps) => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [sprintStartDate, setSprintStartDate] = useState<Date | undefined>();
  const [sprintEndDate, setSprintEndDate] = useState<Date | undefined>();

  useEffect(() => {
    async function updateIteration() {
      if (props.collection && props.project && props.team && props.sprint) {
        const workItemClient = new WorkItemClient(origin);
        const queryClient = new QueryClient(origin, workItemClient);
        const apiClient = new ApiClient(props.origin, queryClient, workItemClient);

        const queryResult = props.project === "WirelineRnD" ? await apiClient.getIteration(props.collection, props.project, props.team, props.sprint) : await apiClient.getIteration2(props.collection, props.project, props.team, props.sprint);

        setWorkItems(queryResult.workItems);
        setSprintStartDate(queryResult.sprintStartDate);
        setSprintEndDate(queryResult.sprintEndDate);
      }
    }
    updateIteration().catch((e: unknown) => console.error(e));
  }, [props.collection, props.project, props.team, props.sprint, props.origin]);

  return (
    <div style={{ height: "100%", overflowY: "scroll" }}>
      <div style={{ float: "left" }}>
        <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} sprintStartDate={sprintStartDate} sprintEndDate={sprintEndDate} />
        <Button style={{ marginLeft: "1em", marginBottom: "1em" }} onClick={() => generateReport(origin, props.collection, props.project, props.team, props.sprint, workItems, sprintStartDate)}>
          Generate Report
        </Button>
      </div>
    </div>
  );
};
