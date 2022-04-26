import { useEffect, useState } from "preact/hooks";
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

    const matches = url.match(/.+_sprints\/taskboard\/(.+?)\/(.+?)\/(?<team>.+?)\/(?<sprint>.+)/);

    if (matches && matches.groups && matches.groups.team && matches.groups.sprint) {
        const team = decodeURI(matches.groups.team);
        const sprint = decodeURI(matches.groups.sprint);
        return (
            <>
                <button onClick={() => setDialogOpen(!dialogOpen)} style={{ height: "32px", margin: "auto 8px" }}>Generate Reports</button>
                <ReportDialog team={team} sprint={sprint} open={dialogOpen} onCloseClicked={() => setDialogOpen(!dialogOpen)} />
            </>
        );
    }
    else {
        return null;
    }
};
