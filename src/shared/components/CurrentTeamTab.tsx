import { Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { usePlatform } from "../context/PlatformContext";
import { generatePdfReport } from "../domain/reports/PdfGenerator";
import { generateReport } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { WorkItemTable } from "./WorkItemTable";

const ExcelIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Excel Icon</title>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h2v5H8z" />
    <path d="M12 15h2v3h-2z" />
    <path d="M16 12h2v6h-2z" />
  </svg>
);

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>PDF Icon</title>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h6" />
    <path d="M9 11h6" />
    <path d="M9 18h6" />
  </svg>
);

interface CurrentTeamTabProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
  fetchFn?: typeof globalThis.fetch;
}

export const CurrentTeamTab = (props: CurrentTeamTabProps) => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [sprintStartDate, setSprintStartDate] = useState<Date | undefined>();
  const [sprintEndDate, setSprintEndDate] = useState<Date | undefined>();
  const platform = usePlatform();

  useEffect(() => {
    async function updateIteration() {
      if (props.collection && props.project && props.team && props.sprint) {
        const apiClient = new ApiClient(props.origin, props.fetchFn);

        const queryResult = await apiClient.getIteration2(props.collection, props.project, props.team, props.iterationPath);

        setWorkItems(queryResult.workItems);
        setSprintStartDate(queryResult.sprintStartDate);
        setSprintEndDate(queryResult.sprintEndDate);
      }
    }
    updateIteration().catch((e: unknown) => console.error(e));
  }, [props.collection, props.project, props.team, props.sprint, props.iterationPath, props.origin, props.fetchFn]);

  return (
    <div style={{ height: "100%", overflowY: "scroll" }}>
      <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} sprintStartDate={sprintStartDate} sprintEndDate={sprintEndDate} />
      <div style={{ display: "flex", gap: "1em", marginLeft: "1em", marginBottom: "1em" }}>
        <Button leftSection={ExcelIcon} onClick={() => generateReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems, sprintStartDate)}>
          Export Excel
        </Button>
        <Button leftSection={PdfIcon} onClick={() => generatePdfReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems, sprintStartDate)}>
          Export PDF
        </Button>
      </div>
    </div>
  );
};
