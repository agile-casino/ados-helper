import { Group, Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api/ApiClient";
import { iterationQueryKey } from "../api/queryKeys";
import { usePlatform } from "../context/PlatformContext";
import { generateAcceptanceCriteriaDocxReport } from "../domain/reports/DocxGenerator";
import { generateAcceptanceCriteriaReport, generatePdfReport } from "../domain/reports/PdfGenerator";
import { generateReport } from "../domain/reports/ReportGenerator";
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
  const platform = usePlatform();
  const enabled = Boolean(props.collection && props.project && props.team && props.sprint);

  const query = useQuery({
    queryKey: iterationQueryKey(props.origin, props.collection, props.project, props.team, props.iterationPath),
    enabled,
    queryFn: () => new ApiClient(props.origin, props.fetchFn).getIteration2(props.collection, props.project, props.team, props.iterationPath)
  });

  if (query.isPending && enabled) {
    return (
      <Group justify="center" align="center" style={{ height: "100%", minHeight: "200px" }}>
        <Loader size="lg" />
        <Text size="md" c="dimmed">
          Loading Work Items...
        </Text>
      </Group>
    );
  }

  const workItems = query.data?.workItems ?? [];
  const sprintStartDate = query.data?.sprintStartDate;
  const sprintEndDate = query.data?.sprintEndDate;

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
