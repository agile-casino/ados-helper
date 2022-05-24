import { useEffect, useState } from "react";
import { ReportDialog } from "./ReportDialog";

export const App = () => {
    const [url, setUrl] = useState(window.location.href);
    const [dialogOpen, setDialogOpen] = useState(false);

    function onUrlChange() {
        setUrl(window.location.href);
    }

    useEffect(() => {
        window.addEventListener('urlChange', onUrlChange);
        return () => window.removeEventListener('urlChange', onUrlChange);
    }, []);

    const matches = url.match(/(?<collection>[\w\d_%]+)\/(?<project>[\w\d_%]+)\/_sprints\/taskboard\/[\w\d_%]+\/[\w\d_%]+\/(?<team>[\w\d_%]+)\/(?<sprint>[\w\d_.%()]+)/);

    if (matches && matches.groups) {
        const collection = decodeURI(matches.groups.collection);
        const project = decodeURI(matches.groups.project);
        const team = decodeURI(matches.groups.team);
        const sprint = decodeURI(matches.groups.sprint);
        return (
            <>
                <button onClick={() => setDialogOpen(!dialogOpen)} style={{ height: "32px", margin: "auto 8px", background: "none", border: "1px solid rgb(234,234,234)" }}>Reports</button>
                <ReportDialog collection={collection} project={project} team={team} sprint={sprint} open={dialogOpen} onCloseClicked={() => setDialogOpen(!dialogOpen)} />
            </>
        );
    }
    else {
        return null;
    }
};
