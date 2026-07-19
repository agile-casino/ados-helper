export interface WorkItemDto {
  Microsoft: {
    VSTS: {
      Common: { ActivatedDate: string } | undefined;
      Scheduling: {
        Effort: number;
        RemainingWork: number | undefined;
        OriginalEstimate: number | undefined;
        CompletedWork: number | undefined;
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
