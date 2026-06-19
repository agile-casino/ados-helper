import { MantineProvider } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import { useCallback, useEffect, useState } from "react";
import { PlatformProvider } from "../shared/context/PlatformContext";
import { BrowserPlatformService } from "./BrowserPlatformService";
import { ReportDialog } from "./ReportDialog";

const platformService = new BrowserPlatformService();

export const App = () => {
  const [url, setUrl] = useState(window.location.href);
  const [origin, setOrigin] = useState(window.location.origin);
  const [dialogOpen, setDialogOpen] = useState(false);

  let colorScheme = useColorScheme();

  const navMenu = document.querySelector(".project-navigation");
  if (navMenu) {
    const navMenuStyle = getComputedStyle(navMenu);
    if (navMenuStyle.backgroundColor === "rgb(59, 58, 57)") {
      colorScheme = "dark";
    }
  }

  const onUrlChange = useCallback(() => {
    setUrl(window.location.href);
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    window.addEventListener("urlChange", onUrlChange);
    return () => window.removeEventListener("urlChange", onUrlChange);
  }, [onUrlChange]);

  // iterationPath captures everything after the team/PROJECT/ prefix, e.g. "Sprint 13" or "2W/Sprint 13"
  const matches = /(?<collection>[\w\-%]+)\/(?<project>[\w\-%]+)\/_sprints\/taskboard\/(?<team>[\w\-%]+)\/[\w\-%]+\/(?<iterationPath>(?:.+\/)?Sprint[\w\-.%()]+)/.exec(url);

  if (matches?.groups) {
    const collection = decodeURI(matches.groups["collection"] ?? "");
    const project = decodeURI(matches.groups["project"] ?? "");
    const team = decodeURI(matches.groups["team"] ?? "");
    const iterationPath = decodeURIComponent(matches.groups["iterationPath"] ?? "");
    const iterationSegments = iterationPath.split("/");
    const sprint = iterationSegments[iterationSegments.length - 1] ?? iterationPath;
    return (
      <PlatformProvider value={platformService}>
        <MantineProvider defaultColorScheme={colorScheme}>
          <button type="button" onClick={() => setDialogOpen(!dialogOpen)} style={{ height: "32px", margin: "auto 8px", background: "none", border: "1px solid rgb(234,234,234)" }}>
            Reports
          </button>
          <ReportDialog origin={origin} collection={collection} project={project} team={team} sprint={sprint} iterationPath={iterationPath} open={dialogOpen} onCloseClicked={() => setDialogOpen(!dialogOpen)} />
        </MantineProvider>
      </PlatformProvider>
    );
  } else {
    return null;
  }
};
