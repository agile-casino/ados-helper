import { Dialog, Tabs, Title } from "@mantine/core";
import { CurrentTeamTab } from "./CurrentTeamTab";
import { MultiTeamTab } from "./MultiTeamTab";

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
        <Title order={4} fw={400} style={{ marginBottom: "1rem" }}>
          <span>{props.sprint} Reports</span>
        </Title>
        <Tabs defaultValue="current-team">
          <Tabs.List>
            <Tabs.Tab value="current-team">Current Team</Tabs.Tab>
            <Tabs.Tab value="multi-team">Multi-Team</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="current-team" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
            <CurrentTeamTab origin={props.origin} collection={props.collection} project={props.project} team={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
          </Tabs.Panel>

          <Tabs.Panel value="multi-team" pt="xs" style={{ height: "calc(650px - 120px)", overflow: "hidden" }}>
            <MultiTeamTab origin={props.origin} collection={props.collection} project={props.project} currentTeam={props.team} sprint={props.sprint} iterationPath={props.iterationPath} />
          </Tabs.Panel>
        </Tabs>
      </Dialog>
    );
  } else {
    return null;
  }
};
