export interface ReportDialogProps {
    open: boolean;
}

export const ReportDialog = (props: ReportDialogProps) => (
    <div style={{ display: props.open ? "block" : "none", position: "absolute", inset: 0, backgroundColor: "white" }}>

    </div>
);