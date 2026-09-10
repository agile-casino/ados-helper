import { z } from "zod";

export class DevOpsApiValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(context: string, issues: z.ZodIssue[]) {
    const first = issues[0];
    const detail = first ? ` at ${first.path.join(".") || "<root>"}: ${first.message}` : "";
    super(`Invalid Azure DevOps response (${context})${detail}`);
    this.name = "DevOpsApiValidationError";
    this.issues = issues;
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new DevOpsApiValidationError(context, result.error.issues);
  }
  return result.data;
}

/**
 * Salvage-first array parsing: validate each element independently and keep the
 * valid ones, dropping (and warning about) malformed entries instead of failing
 * the whole list. A report with a few missing items beats no report at all.
 *
 * Only use `parseOrThrow` for payloads that are structurally unusable when
 * invalid; prefer `salvageArray` / `parseValueArray` everywhere else.
 */
export function salvageArray<T>(schema: z.ZodType<T>, data: unknown, context: string): T[] {
  if (!Array.isArray(data)) {
    if (data !== undefined && data !== null) {
      console.warn(`Expected an array for ${context}, got ${typeof data}; using [].`);
    }
    return [];
  }
  const valid: T[] = [];
  let dropped = 0;
  data.forEach(item => {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      dropped += 1;
    }
  });
  if (dropped > 0) {
    console.warn(`Dropped ${dropped} invalid ${context} entr${dropped === 1 ? "y" : "ies"} of ${data.length}.`);
  }
  return valid;
}

/**
 * Reads `payload.value` leniently (missing/null/non-array → `[]`) and salvages
 * each element. Use for every ADOS `{ value: T[] }` envelope.
 */
export function parseValueArray<T>(schema: z.ZodType<T>, payload: unknown, context: string): T[] {
  const value = payload && typeof payload === "object" ? (payload as { value?: unknown }).value : undefined;
  return salvageArray(schema, value, context);
}

export const AzureDevOpsIterationSchema = z.object({
  name: z.string(),
  // `path` is only used for matching (`path.endsWith(...)`); default it so a
  // missing path does not drop the iteration.
  path: z.string().default(""),
  attributes: z
    .object({
      startDate: z.string().optional(),
      finishDate: z.string().optional()
    })
    .nullish()
});

export type AzureDevOpsIteration = z.infer<typeof AzureDevOpsIterationSchema>;

export const TeamFieldValuesResponseSchema = z.object({
  defaultValue: z.string().nullish()
});

export const WorkItemRefSchema = z.object({ id: z.number() });

export const WorkItemRelationSchema = z.object({
  source: WorkItemRefSchema.nullable().optional(),
  target: WorkItemRefSchema.nullable().optional()
});

const WorkItemFieldsSchema = z
  .object({
    "System.Id": z.number(),
    "System.WorkItemType": z.string(),
    "System.TeamProject": z.string(),
    // Numeric fields are coerced: some ADO processes/on-prem instances return
    // them as numeric strings, and a strict `z.number()` would then drop the
    // entire work item.
    "System.Rev": z.coerce.number(),
    "System.Tags": z.string(),
    "System.State": z.string(),
    // Accepts the string form, the identity object form, and null. `.catch`
    // absorbs any other shape so an unexpected identity payload cannot drop the
    // whole work item; the mapper normalizes the result.
    "System.AssignedTo": z.union([z.string(), z.object({ displayName: z.string().optional() }), z.null()]).catch(null),
    "System.Title": z.string(),
    "System.IterationPath": z.string(),
    "System.HyperLinkCount": z.coerce.number(),
    "Microsoft.VSTS.Common.ActivatedDate": z.string().nullish(),
    "Microsoft.VSTS.Common.AcceptanceCriteria": z.string().nullish(),
    "Microsoft.VSTS.Scheduling.Effort": z.coerce.number().nullish(),
    "Microsoft.VSTS.Scheduling.RemainingWork": z.coerce.number().nullish(),
    "Microsoft.VSTS.Scheduling.OriginalEstimate": z.coerce.number().nullish(),
    "Microsoft.VSTS.Scheduling.CompletedWork": z.coerce.number().nullish()
  })
  .partial();

export const RawWorkItemSchema = z.object({
  id: z.number(),
  fields: WorkItemFieldsSchema.optional(),
  relations: z.array(z.object({ rel: z.string(), url: z.string() })).optional()
});

export type RawWorkItem = z.infer<typeof RawWorkItemSchema>;

// ADO clears fields by emitting `null`, so use `.nullish()` (not `.optional()`).
// Values for these two fields are always strings or null.
const WorkItemFieldUpdateSchema = z.object({
  oldValue: z.string().nullish(),
  newValue: z.string().nullish()
});

export const WorkItemUpdateSchema = z.object({
  id: z.number(),
  rev: z.number(),
  revisedDate: z.string(),
  fields: z
    .object({
      "System.IterationPath": WorkItemFieldUpdateSchema.optional(),
      "System.State": WorkItemFieldUpdateSchema.optional()
    })
    .optional()
});

export type WorkItemUpdate = z.infer<typeof WorkItemUpdateSchema>;

// Only `name` is consumed (useAdoState.ts); `uri` is optional so a missing uri
// cannot hide the organization.
export const OrganizationSchema = z.object({
  name: z.string(),
  uri: z.string().optional()
});

export const NamedValueSchema = z.object({ name: z.string() });

// The accounts lookup is unusable without a profile id, so this is a hard
// boundary validated with `parseOrThrow`.
export const ProfileSchema = z.object({ id: z.string() });

// `path` falls back to `name` because that is how the selector builds/needs it.
export const SprintSchema = z.object({
  name: z.string(),
  path: z.string().optional()
});

export const AccountSchema = z.object({
  accountName: z.string(),
  accountUri: z.string().optional()
});
