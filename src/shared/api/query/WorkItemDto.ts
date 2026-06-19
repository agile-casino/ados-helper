export interface WorkItemDto {
  Microsoft: {
    VSTS: {
      Common?: {
        ActivatedDate?: string;
      };
      Scheduling: {
        Effort: number;
        RemainingWork?: number;
        OriginalEstimate?: number;
        CompletedWork?: number;
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
