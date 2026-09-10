import { WorkItem } from "../domain/WorkItem";
import {
  type AzureDevOpsIteration,
  AzureDevOpsIterationSchema,
  parseValueArray,
  type RawWorkItem,
  RawWorkItemSchema,
  salvageArray,
  TeamFieldValuesResponseSchema,
  WorkItemRefSchema,
  WorkItemRelationSchema,
  type WorkItemUpdate,
  WorkItemUpdateSchema
} from "./schemas";
import type { WorkItemDto } from "./WorkItemDto";
import { WorkItemDtoSchema } from "./WorkItemDto";

interface IterationData {
  workItems: WorkItem[];
  sprintStartDate: Date | undefined;
  sprintEndDate: Date | undefined;
}

const WORK_ITEM_FIELDS = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.AssignedTo",
  "System.IterationPath",
  "System.WorkItemType",
  "System.TeamProject",
  "System.Rev",
  "System.Tags",
  "Microsoft.VSTS.Scheduling.Effort",
  "Microsoft.VSTS.Scheduling.RemainingWork",
  "Microsoft.VSTS.Scheduling.OriginalEstimate",
  "Microsoft.VSTS.Scheduling.CompletedWork",
  "Microsoft.VSTS.Common.ActivatedDate",
  "Microsoft.VSTS.Common.AcceptanceCriteria",
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
  const acceptanceCriteria = f["Microsoft.VSTS.Common.AcceptanceCriteria"] ?? "";
  const activatedDate = f["Microsoft.VSTS.Common.ActivatedDate"] ?? undefined;
  return {
    System: {
      Id: f["System.Id"] ?? wi.id,
      WorkItemType: f["System.WorkItemType"] ?? "",
      TeamProject: f["System.TeamProject"] ?? "",
      Rev: f["System.Rev"] ?? 0,
      Tags: f["System.Tags"] ?? "",
      State: f["System.State"] ?? "",
      AssignedTo: (() => {
        const assignedTo = f["System.AssignedTo"];
        if (assignedTo == null) return null;
        if (typeof assignedTo === "string") return assignedTo;
        return assignedTo.displayName ?? null;
      })(),
      Title: f["System.Title"] ?? "",
      IterationPath: f["System.IterationPath"] ?? "",
      HyperLinkCount: f["System.HyperLinkCount"] ?? 0
    },
    Microsoft: {
      VSTS: {
        Common:
          activatedDate != null || acceptanceCriteria
            ? {
                ActivatedDate: activatedDate,
                AcceptanceCriteria: acceptanceCriteria
              }
            : undefined,
        Scheduling: {
          Effort: f["Microsoft.VSTS.Scheduling.Effort"] ?? 0,
          RemainingWork: f["Microsoft.VSTS.Scheduling.RemainingWork"] ?? undefined,
          OriginalEstimate: f["Microsoft.VSTS.Scheduling.OriginalEstimate"] ?? undefined,
          CompletedWork: f["Microsoft.VSTS.Scheduling.CompletedWork"] ?? undefined
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
    return parseValueArray(AzureDevOpsIterationSchema, data, "iterations");
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
        const parsed = TeamFieldValuesResponseSchema.safeParse(data);
        if (parsed.success && parsed.data.defaultValue) {
          return parsed.data.defaultValue;
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

    const areaPath = await this.getTeamAreaPath(collection, project, team);
    const adoIterationPath = `${project}\\${iterationPath.replace(/\//g, "\\")}`;
    // Note: ASOF only makes the returned ID set historical — field values are
    // fetched separately via the batch endpoint, which always returns current
    // values. The active-item filters (state, removal tag) therefore live in
    // the WIQL, where they are evaluated as of the snapshot date, so items
    // dropped mid-sprint stay in the start snapshot and leave the final one.
    // Remaining skew (e.g. effort edited after the snapshot date, or an item
    // reopened after the sprint closed counting as not-done for that sprint)
    // is an accepted limitation of the public API.
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
        AND [System.State] <> 'Removed'
        AND NOT [System.Tags] CONTAINS '${sprintNumber}-'
        AND [System.AreaPath] UNDER '${areaPath}'
        AND (
          [System.IterationPath] UNDER '${adoIterationPath}' OR (
            [System.IterationPath] UNDER '${project}' AND (
              [System.Tags] CONTAINS '${sprintNumber}' OR
              [System.Tags] CONTAINS '${sprintNumber}+' OR
              [System.Tags] CONTAINS '${sprintNumber}!'
            )
          )
        )
      ASOF '${asOfStr}'
    `
      .replace(/\s+/g, " ")
      .trim();

    const dtos = await this.executeWiqlQuery(collection, project, query);
    return dtos.map(x => new WorkItem(x));
  }

  public async getIteration2(collection: string, project: string, team: string, iteration: string): Promise<IterationData> {
    const iterationSegments = iteration.split("/");
    const sprintName = iterationSegments[iterationSegments.length - 1] ?? iteration;
    const sprintMatch = sprintName.match(/((?:Sprint|Iteration)(?:\s+|-|_|)\d+)/i);
    const sprintNumber = sprintMatch ? sprintMatch[1] : "Sprint XYZ";
    // Fetch dates in parallel, tolerating failure: they are ancillary for the
    // report tabs, which should still render without them. SprintStatsTab
    // fetches dates itself and surfaces failures to the user.
    const datesPromise = this.getIterationDates(collection, project, team, sprintName).catch((error: unknown) => {
      console.warn("Failed to fetch iteration dates:", error);
      return { startDate: undefined, finishDate: undefined };
    });
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

    const flatQuery = `
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
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND (
          [System.WorkItemType] = 'Product Backlog Item' OR
          [System.WorkItemType] = 'Bug' OR
          [System.WorkItemType] = 'Task'
        )
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
    `
      .replace(/\s+/g, " ")
      .trim();

    const workItemDtos = await this.executeWiqlQuery(collection, project, query, flatQuery);

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

    const dates = await datesPromise;

    return {
      workItems: filteredWorkItemDtos.map(x => new WorkItem(x)),
      sprintStartDate: dates.startDate,
      sprintEndDate: dates.finishDate
    };
  }

  public async getWorkItemUpdates(collection: string, project: string, id: number): Promise<WorkItemUpdate[]> {
    // Resilience: called inside Promise.all in SprintStatsTab; a single failure
    // should not block transitions for other work items.
    try {
      const url = `${this.origin}/${encodePathSegment(collection)}/${encodePathSegment(project)}/_apis/wit/workitems/${id}/updates?api-version=${PUBLIC_API_VERSION}`;
      const response = await this._fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch updates for work item ${id}: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return parseValueArray(WorkItemUpdateSchema, data, `updates(${id})`);
    } catch (error) {
      console.warn(`Failed to fetch updates for work item ${id}:`, error);
      return [];
    }
  }

  private async executeWiqlQuery(collection: string, project: string, wiql: string, orphanWiql?: string): Promise<WorkItemDto[]> {
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

    const envelope = result && typeof result === "object" ? (result as { workItemRelations?: unknown; workItems?: unknown }) : {};
    // Salvage each list independently so one malformed relation/item is dropped
    // instead of zeroing out the whole query.
    const relations = salvageArray(WorkItemRelationSchema, envelope.workItemRelations, "workItemRelations");
    const flatItems = salvageArray(WorkItemRefSchema, envelope.workItems, "workItems");

    const ids: number[] = [];
    const parentMap = new Map<number, number>();
    const seen = new Set<number>();

    if (relations.length > 0) {
      for (const link of relations) {
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
    } else {
      for (const ref of flatItems) {
        if (!seen.has(ref.id)) {
          ids.push(ref.id);
          seen.add(ref.id);
        }
      }
    }

    // The orphan query catches items with no hierarchy links, which the
    // WorkItemLinks query can never return. It must run even when the link
    // query returned zero relations (e.g. a sprint of standalone items).
    if (orphanWiql) {
      try {
        const orphanResponse = await this._fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: orphanWiql })
        });
        if (orphanResponse.ok) {
          const orphanResult = await orphanResponse.json();
          const orphanEnvelope = orphanResult && typeof orphanResult === "object" ? (orphanResult as { workItems?: unknown }) : {};
          const orphanItems = salvageArray(WorkItemRefSchema, orphanEnvelope.workItems, "orphanWorkItems");
          for (const ref of orphanItems) {
            if (!seen.has(ref.id)) {
              ids.push(ref.id);
              seen.add(ref.id);
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch orphan work items:", error);
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
            errorPolicy: "Omit"
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Work items batch fetch failed: HTTP ${response.status} - ${text}`);
        }

        const data = await response.json();
        const rawItems = parseValueArray(RawWorkItemSchema, data, "workItemsBatch");
        const dtos: WorkItemDto[] = [];
        for (const raw of rawItems) {
          const parsed = WorkItemDtoSchema.safeParse(rawWorkItemToDto(raw));
          if (parsed.success) {
            dtos.push(parsed.data);
          } else {
            console.warn("Dropping invalid WorkItemDto", parsed.error.issues);
          }
        }
        return dtos;
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
            $expand: "relations",
            errorPolicy: "Omit"
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Work items batch fetch failed: HTTP ${response.status} - ${text}`);
        }

        const data = await response.json();
        const rawItems = parseValueArray(RawWorkItemSchema, data, "workItemRelations");
        return rawItems.map(wi => ({
          id: wi.id,
          hasParent: wi.relations?.some(r => r.rel === "System.LinkTypes.Hierarchy-Reverse") ?? false,
          links: wi.relations?.map(r => r.url) ?? []
        }));
      })
    );

    return results.flat();
  }
}
