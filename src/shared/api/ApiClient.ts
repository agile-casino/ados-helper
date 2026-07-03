import { WorkItem } from "../domain/WorkItem";
import type { IQueryClient } from "./query/IQueryClient";
import type { IWorkItemClient } from "./workItems/IWorkItemClient";

interface IterationData {
  workItems: WorkItem[];
  sprintStartDate?: Date | undefined;
  sprintEndDate?: Date | undefined;
}

export interface AzureDevOpsIteration {
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

  public async getIterations(collection: string, project: string, team: string): Promise<AzureDevOpsIteration[]> {
    try {
      const url = `${this.origin}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=6.0`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch iterations: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.warn("Failed to fetch iterations:", error);
    }
    return [];
  }

  public async getIterationDates(collection: string, project: string, team: string, iteration: string): Promise<{ startDate?: Date | undefined; finishDate?: Date | undefined }> {
    try {
      const url = `${this.origin}/${collection}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=6.0`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch iteration dates: ${response.status} ${response.statusText}`);
      }
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

  public async getTeamAreaPath(collection: string, project: string, team: string): Promise<string> {
    try {
      const url = `${this.origin}/${collection}/${project}/${team}/_apis/work/teamsettings/teamfieldvalues?api-version=6.0`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.defaultValue) {
          return data.defaultValue;
        }
      }
    } catch (error) {
      console.warn("Failed to fetch team field values:", error);
    }
    // Fallback to the existing logic if the request fails
    return `${project}\\Engineering\\${team}`.replace("Pixel_Perfect", "PixelPerfect");
  }

  public async getSprintSnapshot(collection: string, project: string, team: string, iteration: string, iterationPath: string, asOfDate: Date): Promise<WorkItem[]> {
    const asOfStr = asOfDate.toISOString();
    const sprintMatch = iteration.match(/(Sprint \d+)/);
    const sprintNumber = sprintMatch ? sprintMatch[1] : "Sprint XYZ";

    let teamCondition = "";
    if (project === "WirelineRnD") {
      teamCondition = `
        AND (
          [System.IterationPath] UNDER '${project}\\${team}\\${iteration}' OR (
            [System.IterationPath] UNDER '${project}\\${team}' AND (
              [System.Tags] CONTAINS '${sprintNumber}' OR
              [System.Tags] CONTAINS '${sprintNumber}-' OR
              [System.Tags] CONTAINS '${sprintNumber}+' OR
              [System.Tags] CONTAINS '${sprintNumber}!'
            )
          )
        )
      `;
    } else {
      const areaPath = await this.getTeamAreaPath(collection, project, team);
      const adoIterationPath = `${project}\\${iterationPath.replace(/\//g, "\\")}`;
      teamCondition = `
        AND [System.AreaPath] UNDER '${areaPath}'
        AND (
          [System.IterationPath] UNDER '${adoIterationPath}' OR (
            [System.IterationPath] UNDER '${project}' AND (
              [System.Tags] CONTAINS '${sprintNumber}' OR
              [System.Tags] CONTAINS '${sprintNumber}-' OR
              [System.Tags] CONTAINS '${sprintNumber}+' OR
              [System.Tags] CONTAINS '${sprintNumber}!'
            )
          )
        )
      `;
    }

    const query = `
      SELECT
        [System.Id],
        [System.IterationPath],
        [System.WorkItemType],
        [System.Title],
        [System.State],
        [Microsoft.VSTS.Scheduling.Effort]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND (
          [System.WorkItemType] = 'Product Backlog Item' OR
          [System.WorkItemType] = 'Bug'
        )
        ${teamCondition}
      ASOF '${asOfStr}'
    `
      .replace(/\s+/g, " ")
      .trim();

    const workItemDtos = await this.queryClient.runQuery(collection, project, team, query);
    return workItemDtos.map(x => new WorkItem(x));
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
              [Microsoft.VSTS.Scheduling.RemainingWork],
              [Microsoft.VSTS.Scheduling.OriginalEstimate],
              [Microsoft.VSTS.Scheduling.CompletedWork]
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

    let filteredWorkItemDtos = workItemDtos;
    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.workItemClient.getRelations(collection, project, ids);
      const idsToExclude = new Set<number>();
      relations.value.forEach(r => {
        const workItem = workItemDtos.find(workItem => workItem.System.Id === r.id);
        if (workItem) {
          workItem.links = r.relations?.map(l => l.url) ?? [];
          if (workItem.System.WorkItemType === "Task") {
            const hasParent = r.relations?.some(l => l.rel === "System.LinkTypes.Hierarchy-Reverse");
            if (hasParent) {
              idsToExclude.add(r.id);
            }
          }
        }
      });
      if (idsToExclude.size > 0) {
        filteredWorkItemDtos = workItemDtos.filter(x => !idsToExclude.has(x.System.Id));
      }
    }

    const dates = await this.getIterationDates(collection, project, team, iteration);

    return {
      workItems: filteredWorkItemDtos.map(x => new WorkItem(x)),
      sprintStartDate: dates.startDate,
      sprintEndDate: dates.finishDate
    };
  }

  public async getIteration2(collection: string, project: string, team: string, iteration: string): Promise<IterationData> {
    const iterationSegments = iteration.split("/");
    const sprintName = iterationSegments[iterationSegments.length - 1] ?? iteration;
    const sprintMatch = sprintName.match(/(Sprint \d+)/);
    const sprintNumber = sprintMatch ? sprintMatch[1] : "Sprint XYZ";
    const areaPath = await this.getTeamAreaPath(collection, project, team);
    const adoIterationPath = `${project}\\${iteration.replace(/\//g, "\\")}`;
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
              [Microsoft.VSTS.Scheduling.RemainingWork],
              [Microsoft.VSTS.Scheduling.OriginalEstimate],
              [Microsoft.VSTS.Scheduling.CompletedWork]
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
                [Source].[System.IterationPath] UNDER '${adoIterationPath}' OR (
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

    let filteredWorkItemDtos = workItemDtos;
    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.workItemClient.getRelations(collection, project, ids);
      const idsToExclude = new Set<number>();
      relations.value.forEach(r => {
        const workItem = workItemDtos.find(workItem => workItem.System.Id === r.id);
        if (workItem) {
          workItem.links = r.relations?.map(l => l.url) ?? [];
          if (workItem.System.WorkItemType === "Task") {
            const hasParent = r.relations?.some(l => l.rel === "System.LinkTypes.Hierarchy-Reverse");
            if (hasParent) {
              idsToExclude.add(r.id);
            }
          }
        }
      });
      if (idsToExclude.size > 0) {
        filteredWorkItemDtos = workItemDtos.filter(x => !idsToExclude.has(x.System.Id));
      }
    }

    const dates = await this.getIterationDates(collection, project, team, sprintName);

    return {
      workItems: filteredWorkItemDtos.map(x => new WorkItem(x)),
      sprintStartDate: dates.startDate,
      sprintEndDate: dates.finishDate
    };
  }

  public async getWorkItemUpdates(collection: string, project: string, id: number): Promise<unknown[]> {
    try {
      const url = `${this.origin}/${collection}/${project}/_apis/wit/workitems/${id}/updates?api-version=6.0`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch updates for work item ${id}: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.warn(`Failed to fetch updates for work item ${id}:`, error);
      return [];
    }
  }
}
