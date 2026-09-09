export function getWorkItemTypePrefix(workItemType: string): string {
  switch (workItemType) {
    case "Product Backlog Item":
      return "PBI";
    case "User Story":
      return "Story";
    case "Bug":
      return "Bug";
    case "Task":
      return "Task";
    default:
      return workItemType;
  }
}
