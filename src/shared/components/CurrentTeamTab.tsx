import { Group, Loader, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { usePlatform } from "../context/PlatformContext";
import { generateAcceptanceCriteriaDocxReport } from "../domain/reports/DocxGenerator";
import { generateAcceptanceCriteriaReport, generatePdfReport } from "../domain/reports/PdfGenerator";
import { generateReport } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { AcceptanceCriteriaReportSplitButton } from "./AcceptanceCriteriaReportSplitButton";
import { SprintReportSplitButton } from "./SprintReportSplitButton";
import { WorkItemTable } from "./WorkItemTable";

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
        <AcceptanceCriteriaReportSplitButton
          onExportPdf={() => generateAcceptanceCriteriaReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems)}
          onExportWord={() => generateAcceptanceCriteriaDocxReport(platform.saveFile, props.origin, props.collection, props.project, props.team, props.sprint, workItems)}
        />
      </div>
    </div>
  );
};
