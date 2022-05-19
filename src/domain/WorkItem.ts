import { WorkItemDto } from "../api/queryRepository";

export class WorkItem {
    constructor(private dto: WorkItemDto) {
    }

    public get assignedTo(): string {
        return this.dto.System.AssignedTo;
    }

    public get effort(): number {
        return this.dto.Microsoft.VSTS.Scheduling.Effort;
    }

    public get id(): number {
        return this.dto.System.Id;
    }

    public get isDone(): boolean {
        return this.dto.System.State === "Done";
    }

    public get isInProgress(): boolean {
        return this.dto.System.State !== "Done"
            && this.dto.children.some(task => task.System.State !== "To Do")
    }

    public get state(): string {
        return this.dto.System.State;
    }

    public get title(): string {
        return this.dto.System.Title;
    }
}
