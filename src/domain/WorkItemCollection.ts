import sortBy from "lodash/sortBy";
import type { WorkItem } from "./WorkItem";

type WorkItemCategoryName = "Not Started" | "In Progress" | "Done" | "Removed" | "Study Time";

export class WorkItemCollection {
  public get done() {
    const items = this.workItems.filter(w => this.getWorkItemCategory(w) === "Done");
    return sortBy(items, x => x.title);
  }

  public get inProgress() {
    const items = this.workItems.filter(w => this.getWorkItemCategory(w) === "In Progress");
    return sortBy(items, x => x.title);
  }

  public get notStarted() {
    const items = this.workItems.filter(w => this.getWorkItemCategory(w) === "Not Started");
    return sortBy(items, x => x.title);
  }

  public get removed() {
    const items = this.workItems.filter(w => this.getWorkItemCategory(w) === "Removed");
    return sortBy(items, x => x.title);
  }

  public get studyTime() {
    const items = this.workItems.filter(w => this.getWorkItemCategory(w) === "Study Time");
    return sortBy(items, x => x.title);
  }

  public get estimatedSprintStartDate(): Date | undefined {
    // Fallback estimation: Get all activation dates, sorted
    const activatedDates = this.workItems
      .map(w => w.activatedDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (activatedDates.length === 0) return undefined;
    if (activatedDates.length === 1) return activatedDates[0];
    
    // Use the 25th percentile (first quartile) to exclude carried-over items from previous sprints
    const firstQuartileIndex = Math.floor(activatedDates.length * 0.25);
    return activatedDates[firstQuartileIndex];
  }

  public committedWorkItems(sprintStartDate?: Date): WorkItem[] {
    const startDate = sprintStartDate || this.actualSprintStartDate || this.estimatedSprintStartDate;
    if (!startDate) return this.workItems.filter(w => !w.isRemoved);
    
    return this.workItems.filter(w => 
      !w.isRemoved && !w.isPulledInLate(startDate)
    );
  }

  public pulledInWorkItems(sprintStartDate?: Date): WorkItem[] {
    const startDate = sprintStartDate || this.actualSprintStartDate || this.estimatedSprintStartDate;
    if (!startDate) return [];
    
    return this.workItems.filter(w => 
      !w.isRemoved && w.isPulledInLate(startDate)
    );
  }

  public get committedEffort(): number {
    return this.committedWorkItems().reduce((sum, w) => sum + (w.effort || 0), 0);
  }

  public get completedCommittedEffort(): number {
    return this.committedWorkItems()
      .filter(w => w.isDone)
      .reduce((sum, w) => sum + (w.effort || 0), 0);
  }

  public get completedEffort(): number {
    // All completed items, regardless of when they were added
    return this.workItems
      .filter(w => w.isDone && !w.isRemoved)
      .reduce((sum, w) => sum + (w.effort || 0), 0);
  }

  public get pulledInEffort(): number {
    return this.pulledInWorkItems().reduce((sum, w) => sum + (w.effort || 0), 0);
  }

  public get commitmentPercentage(): number {
    if (this.committedEffort === 0) return 0;
    // Completed can be higher than committed if items are pulled in and completed
    return Math.round((this.completedEffort / this.committedEffort) * 100);
  }

  public constructor(
    private workItems: WorkItem[], 
    private actualSprintStartDate?: Date,
    private actualSprintEndDate?: Date
  ) {}

  public getWorkItemCategory(workItem: WorkItem): WorkItemCategoryName {
    if (workItem.title.startsWith("[Study Time]")) {
      return "Study Time";
    } else if (workItem.isDone) {
      return "Done";
    } else if (workItem.isRemoved) {
      return "Removed";
    } else if (workItem.isInProgress && !workItem.isRemoved) {
      return "In Progress";
    }
    return "Not Started";
  }
}
