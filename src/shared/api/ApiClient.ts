import { WorkItem } from "../domain/WorkItem";
import type { WorkItemDto } from "./WorkItemDto";

interface IterationData {
  workItems: WorkItem[];
  sprintStartDate: Date | undefined;
  sprintEndDate: Date | undefined;
}

export interface AzureDevOpsIteration {
  name: string;
  path: string;
  attributes: { startDate?: string; finishDate?: string } | undefined;
}

interface RawWorkItem {
  id: number;
  fields?: Record<string, unknown>;
  relations?: { rel: string; url: string }[];
}

const WORK_ITEM_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.AssignedTo",
  "System.IterationPath",
  "System.WorkItemType",
  "System.TeamProject",
  "System.Tags",
  "Microsoft.VSTS.Scheduling.Effort",
  "Microsoft.VSTS.Scheduling.RemainingWork",
  "Microsoft.VSTS.Scheduling.OriginalEstimate",
  "Microsoft.VSTS.Scheduling.CompletedWork",
  "Microsoft.VSTS.Common.ActivatedDate",
  "System.HyperLinkCount"
];

const PUBLIC_API_VERSION = "7.1";

function encodePathSegment(segment: string): string {
  return segment
    .split("/")
    .map(s => encodeURIComponent(s))
    .join("/");
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function rawWorkItemToDto(wi: RawWorkItem, children: WorkItemDto[] = [], links: string[] = []): WorkItemDto {
  const f = wi.fields ?? {};
  return {
    System: {
      Id: (f["System.Id"] as number) ?? wi.id,
      WorkItemType: (f["System.WorkItemType"] as string) ?? "",
      TeamProject: (f["System.TeamProject"] as string) ?? "",
      Rev: (f["System.Rev"] as number) ?? 0,
      Tags: (f["System.Tags"] as string) ?? "",
      State: (f["System.State"] as string) ?? "",
      AssignedTo: (f["System.AssignedTo"] as string | null) ?? null,
      Title: (f["System.Title"] as string) ?? "",
      IterationPath: (f["System.IterationPath"] as string) ?? "",
      HyperLinkCount: (f["System.HyperLinkCount"] as number) ?? 0
    },
    Microsoft: {
      VSTS: {
        Common:
          f["Microsoft.VSTS.Common.ActivatedDate"] != null
            ? {
                ActivatedDate: f["Microsoft.VSTS.Common.ActivatedDate"] as string
              }
            : undefined,
        Scheduling: {
          Effort: (f["Microsoft.VSTS.Scheduling.Effort"] as number) ?? 0,
          RemainingWork: f["Microsoft.VSTS.Scheduling.RemainingWork"] as number | undefined,
          OriginalEstimate: f["Microsoft.VSTS.Scheduling.OriginalEstimate"] as number | undefined,
          CompletedWork: f["Microsoft.VSTS.Scheduling.CompletedWork"] as number | undefined
        }
      }
    },
    children,
    links
  };
}

export class ApiClient {
  private _fetch: typeof globalThis.fetch;

  constructor(
    private origin: string,
    fetchFn?: typeof globalThis.fetch
  ) {
    this._fetch = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  public async getIterations(collection: string, project: string, team: string): Promise<AzureDevOpsIteration[]> {
    const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/${encodePathSegment(team)}/_apis/work/teamsettings/iterations?api-version=${PUBLIC_API_VERSION}`;
    const response = await this._fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iterations: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.value ?? [];
  }

  public async getIterationDates(collection: string, project: string, team: string, iteration: string): Promise<{ startDate: Date | undefined; finishDate: Date | undefined }> {
    const iterations = await this.getIterations(collection, project, team);
    const sprint = iterations.find(iter => iter.name === iteration || iter.path.endsWith(iteration));
    if (sprint?.attributes) {
      return {
        startDate: sprint.attributes.startDate ? new Date(sprint.attributes.startDate) : undefined,
        finishDate: sprint.attributes.finishDate ? new Date(sprint.attributes.finishDate) : undefined
      };
    }
    return { startDate: undefined, finishDate: undefined };
  }

  public async getTeamAreaPath(collection: string, project: string, team: string): Promise<string> {
    try {
      const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/${encodePathSegment(team)}/_apis/work/teamsettings/teamfieldvalues?api-version=${PUBLIC_API_VERSION}`;
      const response = await this._fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.defaultValue) {
          return data.defaultValue;
        }
      }
    } catch (error) {
      console.warn("Failed to fetch team field values:", error);
    }
    return `${project}\\Engineering\\${team}`.replace("Pixel_Perfect", "PixelPerfect");
  }

  public async getSprintSnapshot(collection: string, project: string, team: string, iteration: string, iterationPath: string, asOfDate: Date): Promise<WorkItem[]> {
    const asOfStr = asOfDate.toISOString();
    const sprintMatch = iteration.match(/((?:Sprint|Iteration)(?:\s+|-|_|)\d+)/i);
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

    const dtos = await this.executeWiqlQuery(collection, project, query);
    return dtos.map(x => new WorkItem(x));
  }

  public async getIteration(collection: string, project: string, team: string, iteration: string): Promise<IterationData> {
    const sprintMatch = iteration.match(/((?:Sprint|Iteration)(?:\s+|-|_|)\d+)/i);
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

    const workItemDtos = await this.executeWiqlQuery(collection, project, query);

    let filteredWorkItemDtos = workItemDtos;
    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.getRelations(collection, project, ids);
      const idsToExclude = new Set<number>();
      relations.forEach(r => {
        const workItem = workItemDtos.find(wi => wi.System.Id === r.id);
        if (workItem) {
          workItem.links = r.links ?? [];
          if (workItem.System.WorkItemType === "Task") {
            if (r.hasParent) {
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
    const sprintMatch = sprintName.match(/((?:Sprint|Iteration)(?:\s+|-|_|)\d+)/i);
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

    const workItemDtos = await this.executeWiqlQuery(collection, project, query);

    let filteredWorkItemDtos = workItemDtos;
    const ids = workItemDtos.map(x => x.System.Id);
    if (ids.length) {
      const relations = await this.getRelations(collection, project, ids);
      const idsToExclude = new Set<number>();
      relations.forEach(r => {
        const workItem = workItemDtos.find(wi => wi.System.Id === r.id);
        if (workItem) {
          workItem.links = r.links ?? [];
          if (workItem.System.WorkItemType === "Task") {
            if (r.hasParent) {
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
    // Resilience: called inside Promise.all in SprintStatsTab; a single failure
    // should not block transitions for other work items.
    try {
      const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/_apis/wit/workitems/${id}/updates?api-version=${PUBLIC_API_VERSION}`;
      const response = await this._fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch updates for work item ${id}: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.value ?? [];
    } catch (error) {
      console.warn(`Failed to fetch updates for work item ${id}:`, error);
      return [];
    }
  }

  private async executeWiqlQuery(collection: string, project: string, wiql: string): Promise<WorkItemDto[]> {
    const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/_apis/wit/wiql?api-version=${PUBLIC_API_VERSION}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: wiql })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WIQL query failed: HTTP ${response.status} - ${text}`);
    }

    const result = await response.json();

    const ids: number[] = [];
    const parentMap = new Map<number, number>();

    if (result.workItemRelations && result.workItemRelations.length > 0) {
      const seen = new Set<number>();
      for (const link of result.workItemRelations) {
        if (link.source && !seen.has(link.source.id)) {
          ids.push(link.source.id);
          seen.add(link.source.id);
        }
        if (link.target && !seen.has(link.target.id)) {
          ids.push(link.target.id);
          seen.add(link.target.id);
        }
        if (link.source && link.target) {
          parentMap.set(link.target.id, link.source.id);
        }
      }
    } else if (result.workItems) {
      for (const ref of result.workItems) {
        ids.push(ref.id);
      }
    }

    if (ids.length === 0) return [];

    const batchResult = await this.fetchWorkItemsBatch(collection, project, ids);

    const dtoMap = new Map<number, WorkItemDto>();
    for (const wi of batchResult) {
      dtoMap.set(wi.System.Id, wi);
    }

    const childrenMap = new Map<number, WorkItemDto[]>();
    for (const [childId, parentId] of parentMap) {
      if (dtoMap.has(childId) && dtoMap.has(parentId)) {
        const child = dtoMap.get(childId);
        if (!child) continue;
        const existing = childrenMap.get(parentId) ?? [];
        existing.push(child);
        childrenMap.set(parentId, existing);
      }
    }

    for (const [parentId, children] of childrenMap) {
      const parent = dtoMap.get(parentId);
      if (parent) {
        parent.children = children;
      }
    }

    const rootItems: WorkItemDto[] = [];
    for (const [id, dto] of dtoMap) {
      if (!parentMap.has(id)) {
        rootItems.push(dto);
      }
    }

    return rootItems;
  }

  private async fetchWorkItemsBatch(collection: string, project: string, ids: number[]): Promise<WorkItemDto[]> {
    const BATCH_SIZE = 200;
    const chunks = chunkArray(ids, BATCH_SIZE);

    const results = await Promise.all(
      chunks.map(async chunk => {
        const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/_apis/wit/workitemsbatch?api-version=${PUBLIC_API_VERSION}`;
        const response = await this._fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: chunk,
            fields: WORK_ITEM_FIELDS,
            $expand: "Fields",
            errorPolicy: "Omit"
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Work items batch fetch failed: HTTP ${response.status} - ${text}`);
        }

        const data = await response.json();
        return (data.value ?? []).map((wi: RawWorkItem) => rawWorkItemToDto(wi));
      })
    );

    return results.flat();
  }

  private async getRelations(collection: string, project: string, ids: number[]): Promise<{ id: number; hasParent: boolean; links: string[] }[]> {
    const BATCH_SIZE = 200;
    const chunks = chunkArray(ids, BATCH_SIZE);

    const results = await Promise.all(
      chunks.map(async chunk => {
        const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/_apis/wit/workitemsbatch?api-version=${PUBLIC_API_VERSION}`;
        const response = await this._fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: chunk,
            fields: [],
            $expand: "relations",
            errorPolicy: "Omit"
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Work items batch fetch failed: HTTP ${response.status} - ${text}`);
        }

        const data = await response.json();
        return (data.value ?? []).map((wi: { id: number; relations?: { rel: string; url: string }[] }) => ({
          id: wi.id,
          hasParent: wi.relations?.some(r => r.rel === "System.LinkTypes.Hierarchy-Reverse") ?? false,
          links: wi.relations?.map(r => r.url) ?? []
        }));
      })
    );

    return results.flat();
  }
}
