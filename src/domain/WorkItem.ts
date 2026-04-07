import countBy from "lodash/countBy";
import maxBy from "lodash/maxBy";
import type { WorkItemDto } from "../api/query/WorkItemDto";
import { parseAzureDate } from "../utils/parseAzureDate";
import { Tag } from "./Tag";

export class WorkItem {
  constructor(private dto: WorkItemDto) {}

  public get assignedTo(): string | null {
    return this.dto.System.AssignedTo;
  }

  public get allTasksDone(): boolean {
    return this.tasks.length > 0 && this.tasks.every(task => task.System.State === "Done" || task.System.State === "Removed");
  }

  public get activatedDate(): Date | null {
    return parseAzureDate(this.dto.Microsoft.VSTS.Common?.ActivatedDate);
  }

  public get effort(): number {
    return this.dto.Microsoft.VSTS.Scheduling.Effort;
  }

  public isPulledInLate(sprintStartDate: Date): boolean {
    // If item was activated more than 2 days after sprint start, consider it pulled in late
    if (!this.activatedDate) return false;
    const twoDaysAfterStart = new Date(sprintStartDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    return this.activatedDate > twoDaysAfterStart;
  }

  public get id(): number {
    return this.dto.System.Id;
  }

  public get isDone(): boolean {
    return ["Done", "Staging", "Released"].includes(this.dto.System.State);
  }

  public get isInProgress(): boolean {
    return !this.isDone && this.tasks.some(task => task.System.State !== "To Do");
  }

  public get isRemoved(): boolean {
    return this.sprintTag?.sprintSuffix === "-";
  }

  public get remainingWork(): number {
    return this.tasks.reduce((acc, task) => {
      const taskRemainingWork = task.Microsoft.VSTS.Scheduling.RemainingWork;
      return acc + (taskRemainingWork ?? 0);
    }, 0);
  }

  public get sprint(): Tag | undefined {
    const sprint = this.dto.System.IterationPath.split("\\").pop();
    return sprint ? new Tag(sprint) : undefined;
  }

  public get sprintTag(): Tag | undefined {
    const sprintTags = this.tags.filter(x => x.sprintNumber);
    if (sprintTags.length > 1) {
      console.log(`Work Item ${this.id} has ${sprintTags.length} sprint tags.`);
    }
    return sprintTags.shift();
  }

  public get state(): string {
    return this.dto.System.State;
  }

  public get tags(): Tag[] {
    return this.dto.System.Tags ? this.dto.System.Tags.split(";").map(x => new Tag(x.trim())) : [];
  }

  public get tasks(): WorkItemDto[] {
    return this.dto.children.filter(task => task.System.State !== "Removed");
  }

  public get title(): string {
    return this.dto.System.Title;
  }

  public get owner(): string | null {
    if (this.dto.System.AssignedTo) {
      return this.dto.System.AssignedTo;
    }

    const taskAssignees = this.tasks.map(x => x.System.AssignedTo).filter(x => x);
    const assigneeFrequencies = countBy(taskAssignees, x => x);

    return maxBy(Object.keys(assigneeFrequencies), x => assigneeFrequencies[x]) ?? null;
  }

  public get wiseNumber(): string | undefined {
    const wiseLink = this.wiseLink;
    if (wiseLink) {
      const match = wiseLink.match(/.+?([0-9]+)$/);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  public get wiseLink(): string | undefined {
    return this.dto.links.find(x => x.includes("wise"));
  }
}
