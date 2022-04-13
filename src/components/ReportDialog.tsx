export interface ReportDialogProps {
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => (
    <div style={{ display: props.open ? "block" : "none", position: "absolute", inset: 0, backgroundColor: "white", zIndex: 1 }}>
        <div style={{ height: "48px", borderBottom: "1px solid silver" }}>
            <a href="#" onClick={props.onCloseClicked} style={{ float: "right", width: "48px", height: "48px", textAlign: "center", lineHeight: "48px", fontSize: "14pt", borderLeft: "1px solid silver", textDecoration: "none" }}>X</a>
        </div>
    </div>
);