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

  public constructor(private workItems: WorkItem[]) {}

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
