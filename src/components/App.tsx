import { ReportDialog } from "./ReportDialog";

export const App = () => (
    <>
        <button onClick={() => alert("Hello World")} style={{ height: "32px", margin: "auto 8px" }}>Generate Reports</button>
        <ReportDialog />
    </>
);
