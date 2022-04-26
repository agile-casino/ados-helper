export interface ReportDialogProps {
    team: string;
    sprint: string;
    open: boolean;
    onCloseClicked: () => void;
}

export const ReportDialog = (props: ReportDialogProps) => {
    if (props.open) {
        return (
            <div class="ui-dialog workitem-dialog ui-dialog-legacy full-screen" style={{ zIndex: 10002 }}>
                <div class="ui-dialog-titlebar">
                    <button type="button" class="ui-button ui-button-icon-only ui-dialog-titlebar-close" onClick={props.onCloseClicked}>
                        <span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    </button>
                </div>
                <div class="work-item-form-main-header" style={{ borderLeftColor: "rgb(0, 156, 204)" }}>
                    <div class="info-text-wrapper" style={{ fontSize: "large", padding: "0.5em" }}>{props.team} {props.sprint} Reports</div>
                </div>
                <div>
                    Content Here
                </div>
            </div>
        );
    }
    else {
        return null;
    }
};
