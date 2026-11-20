import { Group, Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api/ApiClient";
import { iterationQueryKey, sayDoQueryKey } from "../api/queryKeys";
import { fetchSprintSayDo } from "../api/sprintSayDo";
import { usePlatform } from "../context/PlatformContext";
import { useSettings } from "../context/SettingsContext";
import { generateAcceptanceCriteriaDocxReport } from "../domain/reports/DocxGenerator";
import { generateAcceptanceCriteriaReport, generatePdfReport } from "../domain/reports/PdfGenerator";
import { generateReport } from "../domain/reports/ReportGenerator";
import { AcceptanceCriteriaReportSplitButton } from "./AcceptanceCriteriaReportSplitButton";
import { SprintReportSplitButton } from "./SprintReportSplitButton";
import { type SayDoSummary, WorkItemTable } from "./WorkItemTable";

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
  const { stateConfig } = useSettings();
  const configKey = JSON.stringify(stateConfig.states);
  const enabled = Boolean(props.collection && props.project && props.team && props.sprint);

  const query = useQuery({
    queryKey: iterationQueryKey(props.origin, props.collection, props.project, props.team, props.iterationPath, configKey),
    enabled,
    queryFn: () => new ApiClient(props.origin, props.fetchFn, stateConfig).getIteration2(props.collection, props.project, props.team, props.iterationPath)
  });

  const sprintStartDate = query.data?.sprintStartDate;
  const sprintEndDate = query.data?.sprintEndDate;

  // Say-Do needs the sprint-start snapshot, so it is fetched separately from the live work items.
  const sayDoQuery = useQuery({
    queryKey: sayDoQueryKey(props.origin, props.collection, props.project, props.team, props.sprint, props.iterationPath, configKey),
    enabled: enabled && sprintStartDate !== undefined && sprintEndDate !== undefined,
    queryFn: () => {
      if (sprintStartDate === undefined || sprintEndDate === undefined) {
        throw new Error("Sprint dates are not set");
      }
      return fetchSprintSayDo(new ApiClient(props.origin, props.fetchFn, stateConfig), {
        collection: props.collection,
        project: props.project,
        team: props.team,
        sprint: props.sprint,
        iterationPath: props.iterationPath,
        startDate: sprintStartDate,
        finishDate: sprintEndDate
      });
    }
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

  // Without sprint dates the Say-Do Ratio cannot be calculated, so it shows N/A.
  const sayDo: SayDoSummary =
    sprintStartDate === undefined || sprintEndDate === undefined || sayDoQuery.isError ? { percent: null, loading: false } : sayDoQuery.data ? { percent: sayDoQuery.data.percent, loading: false } : { percent: null, loading: true };

  return (
    <div style={{ height: "100%", overflowY: "scroll" }}>
      <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={workItems} sprintStartDate={sprintStartDate} sprintEndDate={sprintEndDate} sayDo={sayDo} />
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
