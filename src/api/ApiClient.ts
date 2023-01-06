import { WorkItem } from "../domain/WorkItem";
import { IQueryClient } from "./query/IQueryClient";
import { IWorkItemClient } from "./workItems/IWorkItemClient";

export class ApiClient {

    constructor(private queryClient: IQueryClient, private workItemClient: IWorkItemClient) {
    }

    public async getIteration(collection: string, project: string, team: string, iteration: string): Promise<WorkItem[]> {
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
        `.replace(/\s+/g, " ").trim();

        const workItemDtos = await this.queryClient.runQuery(collection, project, team, query);

        const ids = workItemDtos.map(x => x.System.Id);
        if (ids.length) {
            const relations = await this.workItemClient.getRelations(collection, project, ids);
            relations.value.forEach(r => {
                const workItem = workItemDtos.find(workItem => workItem.System.Id === r.id);
                if (workItem) {
                    workItem.links = r.relations.map(l => l.url);
                }
            });
        }

        return workItemDtos.map(x => new WorkItem(x));
    }
}
