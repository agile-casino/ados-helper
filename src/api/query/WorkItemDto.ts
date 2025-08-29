export interface WorkItemDto {
  Microsoft: {
    VSTS: {
      Scheduling: {
        Effort: number;
        RemainingWork?: number;
      };
    };
  };
  System: {
    Id: number;
    WorkItemType: string;
    TeamProject: string;
    Rev: number;
    Tags: string;
    State: string;
    AssignedTo: string | null;
    Title: string;
    IterationPath: string;
    HyperLinkCount: number;
  };
  children: WorkItemDto[];
  links: string[];
}
