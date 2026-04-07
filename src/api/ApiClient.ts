import { WorkItem } from "../domain/WorkItem";
import type { IQueryClient } from "./query/IQueryClient";
import type { IWorkItemClient } from "./workItems/IWorkItemClient";

interface IterationData {
  workItems: WorkItem[];
  sprintStartDate?: Date;
  sprintEndDate?: Date;
}

interface AzureDevOpsIteration {
  name: string;
  path: string;
  attributes?: {
    startDate?: string;
    finishDate?: string;
  };
}

export class ApiClient {
  constructor(
    private origin: string,
    private queryClient: IQueryClient,
    private workItemClient: IWorkItemClient
  ) {}

  private async getIterationDates(collection: string, project: string, team: string, iteration: string): Promise<{ startDate?: Date; finishDate?: Date }> {
    try {
      const url = `${this.origin}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=6.0`;
      const response = await fetch(url);
      const data = await response.json();

      const sprint = data.value.find((iter: AzureDevOpsIteration) => iter.name === iteration || iter.path.endsWith(iteration));
      if (sprint?.attributes) {
        return {
          startDate: sprint.attributes.startDate ? new Date(sprint.attributes.startDate) : undefined,
          finishDate: sprint.attributes.finishDate ? new Date(sprint.attributes.finishDate) : undefined
        };
      }
    } catch (error) {
      console.warn("Failed to fetch iteration dates:", error);
    }
    return {};
  }

  public async getIteration(collection: string, project: string, team: string, iteration: string): Promise<IterationData> {
    const sprintMatch = iteration.match(/(Sprint \d+)/);
    const sprintNumber = sprintMatch ? sprintMatch[1] : "Sprint XYZ";
    const query = `
            SELECT
              [System.Id],
              [System.IterationPath],
              [System.WorkItemType],
              [System.Title],
              [System.AssignedTo],
              [System.State],
              [System.Tags],
              [Microsoft.VSTS.Scheduling.Effort],
              [Microsoft.VSTS.Scheduling.RemainingWork]
            FROM WorkItemLinks
            WHERE [Source].[System.TeamProject] = @project
              AND (
                [Source].[System.WorkItemType] = 'Product Backlog Item' OR
                [Source].[System.WorkItemType] = 'Task'
              )
              AND (
                [Source].[System.IterationPath] UNDER '${project}\\${team}\\${iteration}' OR (
                  [Source].[System.IterationPath] UNDER '${project}\\${team}' AND (
                    [Source].[System.Tags] CONTAINS '${sprintNumber}' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}-' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}+' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}!'
                  )
                )
              )
              AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
              AND [Target].[System.TeamProject] = @project
              mode(Recursive)
        `
      .replace(/\s+/g, " ")
      .trim();

    const workItemDtos = await this.queryClient.runQuery(collection, project, team, query);

    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.workItemClient.getRelations(collection, project, ids);
      relations.value.forEach(r => {
        const workItem = workItemDtos.find(workItem => workItem.System.Id === r.id);
        if (workItem) {
          workItem.links = r.relations?.map(l => l.url) ?? [];
        }
      });
    }

    const dates = await this.getIterationDates(collection, project, team, iteration);

    return {
      workItems: workItemDtos.map(x => new WorkItem(x)),
      sprintStartDate: dates.startDate,
      sprintEndDate: dates.finishDate
    };
  }

  public async getIteration2(collection: string, project: string, team: string, iteration: string): Promise<IterationData> {
    const sprintMatch = iteration.match(/(Sprint \d+)/);
    const sprintNumber = sprintMatch ? sprintMatch[1] : "Sprint XYZ";
    const areaPath = `${project}\\Engineering\\${team}`.replace("Pixel_Perfect", "PixelPerfect");
    const query = `
            SELECT
              [System.Id],
              [System.IterationPath],
              [System.WorkItemType],
              [System.Title],
              [System.AssignedTo],
              [System.State],
              [System.Tags],
              [Microsoft.VSTS.Common.ActivatedDate],
              [Microsoft.VSTS.Scheduling.Effort],
              [Microsoft.VSTS.Scheduling.RemainingWork]
            FROM WorkItemLinks
            WHERE [Source].[System.TeamProject] = @project
              AND (
                [Source].[System.WorkItemType] = 'Product Backlog Item' OR
                [Source].[System.WorkItemType] = 'Bug' OR
                [Source].[System.WorkItemType] = 'Task'
              )
              AND (
                [Source].[Area Path] UNDER '${areaPath}'
              )
              AND (
                [Source].[System.IterationPath] UNDER '${project}\\${iteration}' OR (
                  [Source].[System.IterationPath] UNDER '${project}' AND (
                    [Source].[System.Tags] CONTAINS '${sprintNumber}' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}-' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}+' OR
                    [Source].[System.Tags] CONTAINS '${sprintNumber}!'
                  )
                )
              )
              AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
              AND [Target].[System.TeamProject] = @project
              mode(Recursive)
        `
      .replace(/\s+/g, " ")
      .trim();

    const workItemDtos = await this.queryClient.runQuery(collection, project, team, query);

    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.workItemClient.getRelations(collection, project, ids);
      relations.value.forEach(r => {
        const workItem = workItemDtos.find(workItem => workItem.System.Id === r.id);
        if (workItem) {
          workItem.links = r.relations?.map(l => l.url) ?? [];
        }
      });
    }

    const dates = await this.getIterationDates(collection, project, team, iteration);

    return {
      workItems: workItemDtos.map(x => new WorkItem(x)),
      sprintStartDate: dates.startDate,
      sprintEndDate: dates.finishDate
    };
  }
}
