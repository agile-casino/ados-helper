import { Button, Checkbox, ColorInput, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { ApiClient } from "../api/ApiClient";
import { QueryClient } from "../api/query/QueryClient";
import { WorkItemClient } from "../api/workItems/WorkItemClient";
import type { WorkItem } from "../domain/WorkItem";
import { type TeamWorkItems, generateMultiTeamReport } from "../domain/reports/ReportGenerator";
import { WorkItemTable } from "./WorkItemTable";

interface MultiTeamTabProps {
  origin: string;
  collection: string;
  project: string;
  currentTeam: string;
  sprint: string;
}

interface TeamSelection {
  name: string;
  selected: boolean;
  backgroundColor?: string;
}

interface TeamData {
  team: string;
  workItems: WorkItem[];
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY_PREFIX = "ados-helper-multi-team-";

const getStorageKey = (collection: string, project: string): string => {
  return `${STORAGE_KEY_PREFIX}${collection}-${project}`;
};

const loadTeamsFromStorage = (collection: string, project: string): TeamSelection[] | null => {
  try {
    const stored = localStorage.getItem(getStorageKey(collection, project));
    if (stored) {
      return JSON.parse(stored) as TeamSelection[];
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

const saveTeamsToStorage = (collection: string, project: string, teams: TeamSelection[]): void => {
  try {
    localStorage.setItem(getStorageKey(collection, project), JSON.stringify(teams));
  } catch {
    // Ignore storage errors
  }
};

export const MultiTeamTab = (props: MultiTeamTabProps) => {
  const [teamInput, setTeamInput] = useState<string>("");
  const [teams, setTeams] = useState<TeamSelection[]>([]);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t) => !teams.some((existing) => existing.name.toLowerCase() === t.toLowerCase()));

    if (newTeamNames.length > 0) {
      setTeams([...teams, ...newTeamNames.map((name) => ({ name, selected: true, backgroundColor: undefined }))]);
      setTeamInput("");
    }
  };

  const handleTeamToggle = (teamName: string) => {
    setTeams(teams.map((t) => (t.name === teamName ? { ...t, selected: !t.selected } : t)));
  };

  const handleColorChange = (teamName: string, color: string) => {
    setTeams(teams.map((t) => (t.name === teamName ? { ...t, backgroundColor: color || undefined } : t)));
  };

  const handleRemoveTeam = (teamName: string) => {
    setTeams(teams.filter((t) => t.name !== teamName));
    setTeamData(teamData.filter((t) => t.team !== teamName));
  };

  const handleMoveTeamUp = (index: number) => {
    if (index === 0) return;
    const newTeams = [...teams];
    [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
    setTeams(newTeams);
  };

  const handleMoveTeamDown = (index: number) => {
    if (index === teams.length - 1) return;
    const newTeams = [...teams];
    [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
    setTeams(newTeams);
  };

  const handleLoadData = async () => {
    const selectedTeams = teams.filter((t) => t.selected);
    if (selectedTeams.length === 0) return;

    setIsLoading(true);

    const workItemClient = new WorkItemClient(props.origin);
    const queryClient = new QueryClient(props.origin, workItemClient);
    const apiClient = new ApiClient(queryClient, workItemClient);

    const results: TeamData[] = [];

    for (const team of selectedTeams) {
      try {
        const queryResult =
          props.project === "WirelineRnD"
            ? await apiClient.getIteration(props.collection, props.project, team.name, props.sprint)
            : await apiClient.getIteration2(props.collection, props.project, team.name, props.sprint);

        results.push({
          team: team.name,
          workItems: queryResult,
          loading: false,
          error: null,
        });
      } catch (error) {
        results.push({
          team: team.name,
          workItems: [],
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load data",
        });
      }
    }

    setTeamData(results);
    setIsLoading(false);
  };

  const handleGenerateCombinedReport = () => {
    const validTeamData = teamData.filter((t) => t.workItems.length > 0 && !t.error);
    if (validTeamData.length === 0) return;

    const teamWorkItems: TeamWorkItems[] = validTeamData.map((t) => {
      const teamSelection = teams.find((ts) => ts.name === t.team);
      return {
        team: t.team,
        workItems: t.workItems,
        backgroundColor: teamSelection?.backgroundColor,
      };
    });

    generateMultiTeamReport(props.origin, props.collection, props.project, props.sprint, teamWorkItems);
  };

  const selectedTeamsCount = teams.filter((t) => t.selected).length;
  const hasLoadedData = teamData.length > 0;
  const canGenerateReport = teamData.some((t) => t.workItems.length > 0 && !t.error);

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
              onChange={(e) => setTeamInput(e.currentTarget.value)}
              placeholder="Team A, Team B, Team C"
              style={{ flex: 1 }}
              onKeyDown={(e) => {
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
                alignItems: "center",
              }}
            >
              {/* Header row */}
              <Text size="xs" fw={500} c="dimmed" />
              <Text size="xs" fw={500} c="dimmed">Team</Text>
              <Text size="xs" fw={500} c="dimmed">Header Color</Text>
              <Text size="xs" fw={500} c="dimmed" style={{ textAlign: "center" }}>Order</Text>
              <Text size="xs" fw={500} c="dimmed" />

              {teams.map((team, index) => (
                <>
                  <Checkbox
                    key={`${team.name}-checkbox`}
                    checked={team.selected}
                    onChange={() => handleTeamToggle(team.name)}
                  />
                  <Text key={`${team.name}-label`} size="sm">{team.name}</Text>
                  <ColorInput
                    key={`${team.name}-color`}
                    value={team.backgroundColor || ""}
                    onChange={(color) => handleColorChange(team.name, color)}
                    placeholder="None"
                    size="xs"
                  />
                  <Group key={`${team.name}-order`} gap={4} wrap="nowrap">
                    <Button variant="subtle" size="xs" onClick={() => handleMoveTeamUp(index)} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button variant="subtle" size="xs" onClick={() => handleMoveTeamDown(index)} disabled={index === teams.length - 1}>
                      ↓
                    </Button>
                  </Group>
                  <Button key={`${team.name}-remove`} variant="subtle" color="red" size="xs" onClick={() => handleRemoveTeam(team.name)}>
                    Remove
                  </Button>
                </>
              ))}
            </div>
          </div>
        )}

        <Group gap="xs">
          <Button onClick={handleLoadData} loading={isLoading} disabled={selectedTeamsCount === 0}>
            Load Data ({selectedTeamsCount} team{selectedTeamsCount !== 1 ? "s" : ""})
          </Button>
          {hasLoadedData && (
            <Button onClick={handleGenerateCombinedReport} disabled={!canGenerateReport}>
              Generate Combined Report
            </Button>
          )}
        </Group>

        {teamData.map((data) => (
          <div key={data.team}>
            <Title order={5} mb="xs">
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
              <WorkItemTable origin={props.origin} collection={props.collection} project={props.project} workItems={data.workItems} />
            )}
          </div>
        ))}
      </Stack>
    </div>
  );
};
