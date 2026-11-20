import { ActionIcon, Dialog, Group, Tabs, Title, Tooltip } from "@mantine/core";
import { queryClient } from "../shared/api/queryClient";
import { CurrentTeamTab } from "../shared/components/CurrentTeamTab";
import { MultiTeamTab } from "../shared/components/MultiTeamTab";
import { SettingsTab } from "../shared/components/SettingsTab";
import { SprintStatsTab } from "../shared/components/SprintStatsTab";
import { TrendsTab } from "../shared/components/TrendsTab";
import { SettingsProvider } from "../shared/context/SettingsContext";

interface ReportDialogProps {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
  open: boolean;
  onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {
  if (props.open) {
    return (
      <Dialog opened={true} w={1000} h={650} withCloseButton={true} onClose={props.onCloseClicked}>
        <Group gap="xs" align="center" mb="md" wrap="nowrap">
          <Title order={4} fw={400} style={{ flexGrow: 1 }}>
            <span>{props.sprint} Reports</span>
          </Title>
          <Tooltip label="Refresh data for current sprint">
            <ActionIcon variant="subtle" onClick={() => queryClient.invalidateQueries()} aria-label="Refresh">
              &#x21bb;
            </ActionIcon>
          </Tooltip>
        </Group>
        <SettingsProvider key={`${props.collection}-${props.project}`} collection={props.collection} project={props.project}>
          <Tabs defaultValue="current-team">
            <Tabs.List>
              <Tabs.Tab value="current-team">Current Team</Tabs.Tab>
              <Tabs.Tab value="multi-team">Multi-Team</Tabs.Tab>
              <Tabs.Tab value="sprint-stats">Sprint Stats</Tabs.Tab>
              <Tabs.Tab value="trends">Trends</Tabs.Tab>
              <Tabs.Tab value="settings" ml="auto">
                Settings
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="current-team" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
              <CurrentTeamTab origin={props.origin} collection={props.collection} project={props.project} team={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="multi-team" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
              <MultiTeamTab origin={props.origin} collection={props.collection} project={props.project} currentTeam={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="sprint-stats" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
              <SprintStatsTab origin={props.origin} collection={props.collection} project={props.project} team={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="trends" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
              <TrendsTab origin={props.origin} collection={props.collection} project={props.project} team={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
              <SettingsTab origin={props.origin} collection={props.collection} project={props.project} />
            </Tabs.Panel>
          </Tabs>
        </SettingsProvider>
      </Dialog>
    );
  } else {
    return null;
  }
};
