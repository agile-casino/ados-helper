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

    const matches = url.match(/.+_sprints\/taskboard\/(.+?)\/(.+?)\/(.+?)\/(.+)/);

    console.log(matches);

    if (matches) {
        const team = decodeURI(matches[3]);
        const sprint = decodeURI(matches[4]);
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
