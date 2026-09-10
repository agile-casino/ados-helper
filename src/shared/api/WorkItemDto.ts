import { z } from "zod";

const BaseWorkItemDtoSchema = z.object({
  Microsoft: z.object({
    VSTS: z.object({
      Common: z
        .object({
          ActivatedDate: z.string().optional(),
          AcceptanceCriteria: z.string().optional()
        })
        .optional(),
      Scheduling: z.object({
        Effort: z.number(),
        RemainingWork: z.number().optional(),
        OriginalEstimate: z.number().optional(),
        CompletedWork: z.number().optional()
      })
    })
  }),
  System: z.object({
    Id: z.number(),
    WorkItemType: z.string(),
    TeamProject: z.string(),
    Rev: z.number(),
    Tags: z.string(),
    State: z.string(),
    AssignedTo: z.string().nullable(),
    Title: z.string(),
    IterationPath: z.string(),
    HyperLinkCount: z.number()
  }),
  links: z.array(z.string())
});

export type WorkItemDto = z.infer<typeof BaseWorkItemDtoSchema> & {
  children: WorkItemDto[];
};

export const WorkItemDtoSchema: z.ZodType<WorkItemDto> = BaseWorkItemDtoSchema.extend({
  children: z.lazy(() => z.array(WorkItemDtoSchema))
});
