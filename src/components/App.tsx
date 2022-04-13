import { useState } from "preact/hooks";
import { ReportDialog } from "./ReportDialog";

export const App = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <>
            <button onClick={() => setDialogOpen(!dialogOpen)} style={{ height: "32px", margin: "auto 8px" }}>Generate Reports</button>
            <ReportDialog open={dialogOpen} />
        </>
    );
};
