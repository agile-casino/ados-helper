import { Button, Group, Loader, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { usePlatform } from "../context/PlatformContext";
import { generateAcceptanceCriteriaReport, generatePdfReport } from "../domain/reports/PdfGenerator";
import { generateReport } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { SprintReportSplitButton } from "./SprintReportSplitButton";
import { WorkItemTable } from "./WorkItemTable";

const ChecklistIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <title>Acceptance Criteria Icon</title>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="m9 14 2 2 4-4" />
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
  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [sprintStartDate, setSprintStartDate] = useState<Date | undefined>();
  const [sprintEndDate, setSprintEndDate] = useState<Date | undefined>();
  const platform = usePlatform();

  useEffect(() => {
    let active = true;

    async function updateIteration() {
      if (props.collection && props.project && props.team && props.sprint) {
        setLoading(true);
        try {
          const apiClient = new ApiClient(props.origin, props.fetchFn);

          const queryResult = await apiClient.getIteration2(props.collection, props.project, props.team, props.iterationPath);

          if (active) {
            setWorkItems(queryResult.workItems);
            setSprintStartDate(queryResult.sprintStartDate);
            setSprintEndDate(queryResult.sprintEndDate);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    }
    updateIteration().catch((e: unknown) => console.error(e));

    return () => {
      active = false;
    };
  }, [props.collection, props.project, props.team, props.sprint, props.iterationPath, props.origin, props.fetchFn]);

  if (loading) {
    return (
      <Group justify="center" align="center" style={{ height: "100%", minHeight: "200px" }}>
        <Loader size="lg" />
        <Text size="md" c="dimmed">
          Loading Work Items...
        </Text>
      </Group>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "scroll" }}>
      <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} sprintStartDate={sprintStartDate} sprintEndDate={sprintEndDate} />
      <div style={{ display: "flex", gap: "1em", marginLeft: "1em", marginBottom: "1em" }}>
        <SprintReportSplitButton
          onExportExcel={() => generateReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems, sprintStartDate)}
          onExportPdf={() => generatePdfReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems, sprintStartDate)}
        />
        <Button leftSection={ChecklistIcon} onClick={() => generateAcceptanceCriteriaReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems)}>
          Acceptance Criteria Report
        </Button>
      </div>
    </div>
  );
};
