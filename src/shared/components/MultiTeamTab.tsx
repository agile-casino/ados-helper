import { Button, Checkbox, ColorInput, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { Fragment, useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { usePlatform } from "../context/PlatformContext";
import { generateMultiTeamAcceptanceCriteriaDocxReport } from "../domain/reports/DocxGenerator";
import { generateMultiTeamAcceptanceCriteriaReport, generateMultiTeamPdfReport } from "../domain/reports/PdfGenerator";
import { generateMultiTeamReport, type TeamWorkItems } from "../domain/reports/ReportGenerator";
import type { WorkItem } from "../domain/WorkItem";
import { loadTeamsFromStorage, saveTeamsToStorage, type TeamSelection } from "../utils/teamStorage";
import { AcceptanceCriteriaReportSplitButton } from "./AcceptanceCriteriaReportSplitButton";
import { SprintReportSplitButton } from "./SprintReportSplitButton";
import { WorkItemTable } from "./WorkItemTable";

const DEFAULT_TEAM_COLORS: Record<string, string> = {
  "DE_BK_Green": "#94ff8f",
  "DE_BK_Blue": "#4a9eff",
  "DE_EX_Yellow": "#ffe491",
  "DE_EX_UX": "#e4dfec",
  "DE_EX_TechDoc": "#feddb7"
};

function getDefaultTeamColor(teamName: string): string | undefined {
  return DEFAULT_TEAM_COLORS[teamName];
}

interface MultiTeamTabProps {
  origin: string;
  collection: string;
  project: string;
  currentTeam: string;
  sprint: string;
  iterationPath: string;
  fetchFn?: typeof globalThis.fetch;
}

interface TeamData {
  team: string;
  workItems: WorkItem[];
  sprintStartDate?: Date | undefined;
  sprintEndDate?: Date | undefined;
  loading: boolean;
  error: string | null;
}

export const MultiTeamTab = (props: MultiTeamTabProps) => {
  const [teamInput, setTeamInput] = useState<string>("");
  const [teams, setTeams] = useState<TeamSelection[]>([]);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const platform = usePlatform();
  const [initialized, setInitialized] = useState(false);

  // Load teams from localStorage on mount, or fallback to current team
  useEffect(() => {
    const storedTeams = loadTeamsFromStorage(props.collection, props.project);
    if (storedTeams && storedTeams.length > 0) {
      setTeams(storedTeams);
    } else if (props.currentTeam) {
      setTeams([{ name: props.currentTeam, selected: true }]);
    }
    setInitialized(true);
  }, [props.collection, props.project, props.currentTeam]);

  // Save teams to localStorage whenever they change (after initialization)
  useEffect(() => {
    if (initialized) {
      saveTeamsToStorage(props.collection, props.project, teams);
    }
  }, [teams, initialized, props.collection, props.project]);

  const handleAddTeams = () => {
    if (!teamInput.trim()) return;

    const newTeamNames = teamInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .filter(t => !teams.some(existing => existing.name.toLowerCase() === t.toLowerCase()));

    if (newTeamNames.length > 0) {
      setTeams([...teams, ...newTeamNames.map(name => ({ name, selected: true, backgroundColor: getDefaultTeamColor(name) }))]);
      setTeamInput("");
    }
  };

  const handleTeamToggle = (teamName: string) => {
    setTeams(teams.map(t => (t.name === teamName ? { ...t, selected: !t.selected } : t)));
  };

  const handleColorChange = (teamName: string, color: string) => {
    setTeams(teams.map(t => (t.name === teamName ? { ...t, backgroundColor: color || undefined } : t)));
  };

  const handleRemoveTeam = (teamName: string) => {
    setTeams(teams.filter(t => t.name !== teamName));
    setTeamData(teamData.filter(t => t.team !== teamName));
  };

  const handleMoveTeamUp = (index: number) => {
    if (index === 0) return;
    const newTeams = [...teams];
    const previousTeam = newTeams[index - 1];
    const currentTeam = newTeams[index];

    if (!previousTeam || !currentTeam) {
      return;
    }

    [newTeams[index - 1], newTeams[index]] = [currentTeam, previousTeam];
    setTeams(newTeams);
  };

  const handleMoveTeamDown = (index: number) => {
    if (index === teams.length - 1) return;
    const newTeams = [...teams];
    const currentTeam = newTeams[index];
    const nextTeam = newTeams[index + 1];

    if (!currentTeam || !nextTeam) {
      return;
    }

    [newTeams[index], newTeams[index + 1]] = [nextTeam, currentTeam];
    setTeams(newTeams);
  };

  const handleLoadData = async () => {
    const selectedTeams = teams.filter(t => t.selected);
    if (selectedTeams.length === 0) return;

    setIsLoading(true);

    const apiClient = new ApiClient(props.origin, props.fetchFn);

    const results: TeamData[] = [];

    for (const team of selectedTeams) {
      try {
        const queryResult = await apiClient.getIteration2(props.collection, props.project, team.name, props.iterationPath);

        results.push({
          team: team.name,
          workItems: queryResult.workItems,
          sprintStartDate: queryResult.sprintStartDate,
          sprintEndDate: queryResult.sprintEndDate,
          loading: false,
          error: null
        });
      } catch (error) {
        results.push({
          team: team.name,
          workItems: [],
          sprintStartDate: undefined,
          sprintEndDate: undefined,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load data"
        });
      }
    }

    setTeamData(results);
    setIsLoading(false);
  };

  const getValidTeamWorkItems = (): TeamWorkItems[] => {
    const validTeamData = teamData.filter(t => t.workItems.length > 0 && !t.error);
    if (validTeamData.length === 0) return [];

    return validTeamData.map(t => {
      const teamSelection = teams.find(ts => ts.name === t.team);
      return {
        team: t.team,
        workItems: t.workItems,
        backgroundColor: teamSelection?.backgroundColor ?? undefined,
        sprintStartDate: t.sprintStartDate
      };
    });
  };

  const handleGenerateCombinedReport = () => {
    generateMultiTeamReport(platform.saveFile, props.origin, props.collection, props.project, props.sprint, getValidTeamWorkItems());
  };

  const handleGenerateCombinedPdfReport = () => {
    generateMultiTeamPdfReport(platform.saveFile, props.origin, props.collection, props.project, props.sprint, getValidTeamWorkItems());
  };

  const handleGenerateCombinedAcceptanceCriteriaReport = () => {
    generateMultiTeamAcceptanceCriteriaReport(platform.saveFile, props.origin, props.collection, props.project, props.sprint, getValidTeamWorkItems());
  };

  const handleGenerateCombinedAcceptanceCriteriaDocxReport = () => {
    generateMultiTeamAcceptanceCriteriaDocxReport(platform.saveFile, props.origin, props.collection, props.project, props.sprint, getValidTeamWorkItems());
  };

  const selectedTeamsCount = teams.filter(t => t.selected).length;
  const hasLoadedData = teamData.length > 0;
  const canGenerateReport = teamData.some(t => t.workItems.length > 0 && !t.error);

  return (
    <div style={{ height: "100%", overflowY: "scroll" }}>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Add teams (comma-separated):
          </Text>
          <Group gap="xs">
            <TextInput
              value={teamInput}
              onChange={e => setTeamInput(e.currentTarget.value)}
              placeholder="Team A, Team B, Team C"
              style={{ flex: 1 }}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddTeams();
              }}
            />
            <Button onClick={handleAddTeams} size="sm">
              Add
            </Button>
          </Group>
        </div>

        {teams.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              Teams for {props.sprint}:
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr 130px auto auto",
                gap: "8px",
                alignItems: "center"
              }}
            >
              {/* Header row */}
              <Text size="xs" fw={500} c="dimmed" />
              <Text size="xs" fw={500} c="dimmed">
                Team
              </Text>
              <Text size="xs" fw={500} c="dimmed">
                Header Color
              </Text>
              <Text size="xs" fw={500} c="dimmed" style={{ textAlign: "center" }}>
                Order
              </Text>
              <Text size="xs" fw={500} c="dimmed" />

              {teams.map((team, index) => (
                <Fragment key={team.name}>
                  <Checkbox checked={team.selected} onChange={() => handleTeamToggle(team.name)} />
                  <Text size="sm">{team.name}</Text>
                  <ColorInput value={team.backgroundColor || ""} onChange={color => handleColorChange(team.name, color)} placeholder="None" size="xs" />
                  <Group gap={4} wrap="nowrap">
                    <Button variant="subtle" size="xs" onClick={() => handleMoveTeamUp(index)} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button variant="subtle" size="xs" onClick={() => handleMoveTeamDown(index)} disabled={index === teams.length - 1}>
                      ↓
                    </Button>
                  </Group>
                  <Button variant="subtle" color="red" size="xs" onClick={() => handleRemoveTeam(team.name)}>
                    Remove
                  </Button>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        <Group gap="xs">
          <Button onClick={handleLoadData} loading={isLoading} disabled={selectedTeamsCount === 0}>
            Load Data ({selectedTeamsCount} team{selectedTeamsCount !== 1 ? "s" : ""})
          </Button>
          {hasLoadedData && (
            <>
              <SprintReportSplitButton onExportExcel={handleGenerateCombinedReport} onExportPdf={handleGenerateCombinedPdfReport} disabled={!canGenerateReport} />
              <AcceptanceCriteriaReportSplitButton onExportPdf={handleGenerateCombinedAcceptanceCriteriaReport} onExportWord={handleGenerateCombinedAcceptanceCriteriaDocxReport} disabled={!canGenerateReport} />
            </>
          )}
        </Group>

        {teamData.map(data => {
          const teamSelection = teams.find(t => t.name === data.team);
          const teamColor = teamSelection?.backgroundColor;

          return (
            <div key={data.team}>
              <Title
                order={5}
                mb="xs"
                style={{
                  borderBottom: teamColor ? `4px solid ${teamColor}` : undefined,
                  paddingBottom: "4px",
                  display: "inline-block"
                }}
              >
                {data.team}
              </Title>
              {data.error ? (
                <Text color="red" size="sm">
                  Error: {data.error}
                </Text>
              ) : data.workItems.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No work items found
                </Text>
              ) : (
                <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={data.workItems} sprintStartDate={data.sprintStartDate} sprintEndDate={data.sprintEndDate} />
              )}
            </div>
          );
        })}
      </Stack>
    </div>
  );
};
