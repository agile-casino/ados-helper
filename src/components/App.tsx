import { useEffect, useState } from "react";
import { ReportDialog } from "./ReportDialog";
import { useColorScheme } from "@mantine/hooks";
import { MantineProvider } from "@mantine/core";

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

    function onUrlChange() {
        setUrl(window.location.href);
        setOrigin(window.location.origin);
    }

    useEffect(() => {
        window.addEventListener('urlChange', onUrlChange);
        return () => window.removeEventListener('urlChange', onUrlChange);
    }, []);

    const matches = /(?<collection>[\w\-%]+)\/(?<project>[\w\-%]+)\/_sprints\/taskboard\/(?<team>[\w\-%]+)\/.+?\/(?<sprint>Sprint[\w\-.%()]+)/.exec(url);

    if (matches?.groups) {
        const collection = decodeURI(matches.groups.collection);
        const project = decodeURI(matches.groups.project);
        const team = decodeURI(matches.groups.team);
        const sprint = decodeURI(matches.groups.sprint);
        return (
            <MantineProvider defaultColorScheme={colorScheme}>
                <button onClick={() => setDialogOpen(!dialogOpen)} style={{ height: "32px", margin: "auto 8px", background: "none", border: "1px solid rgb(234,234,234)" }}>Reports</button>
                <ReportDialog origin={origin} collection={collection} project={project} team={team} sprint={sprint} open={dialogOpen} onCloseClicked={() => setDialogOpen(!dialogOpen)} />
            </MantineProvider>
        );
    }
    else {
        return null;
    }
};
