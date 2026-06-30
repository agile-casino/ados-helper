# Zod Implementation Plan: ados-helper

This document outlines the sequential steps and design guidelines for implementing runtime validation using the `zod` library in **ados-helper**.

---

## 1. Background & Objectives

Currently, the application relies entirely on compile-time TypeScript type definitions. At runtime, data loaded from browser `localStorage` or fetched from external Azure DevOps (ADOS) API endpoints is cast directly using the `as` operator (e.g., `JSON.parse(stored) as TeamSelection[]`).

### The Risks:

- **UI Crashes:** If the shape of the data returned by the ADOS API changes (API drift), or if users have older settings stored in their browser, the UI will crash with downstream JS errors (like `Cannot read properties of undefined`).
- **Silent Corruption:** Unsafe casts allow invalid data to populate the React context or local state, causing unpredictable behavior that is difficult to trace.

### Goals of Zod Integration:

1. **Safety at the Boundary:** Validate all incoming external data (LocalStorage configuration and REST API responses) before they enter the application's internal state.
2. **Graceful Error Recovery:** Provide clean, user-friendly warnings or default fallback states instead of crashing the React application thread.
3. **Type Inference:** Automatically derive TypeScript types from the Zod schemas, reducing code duplication.

---

## 2. Key Target Areas & Schema Designs

### Area 2.1: LocalStorage Configuration Parsing

In [MultiTeamTab.tsx](file:///root/ados-helper/src/shared/components/MultiTeamTab.tsx#L76-L86), we load team configuration arrays. We will replace the unsafe cast with a Zod schema.

**Proposed Schema:**

```typescript
import { z } from "zod";

export const TeamSelectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActivelyMonitored: z.boolean().default(true),
});

export const TeamSelectionArraySchema = z.array(TeamSelectionSchema);

export type TeamSelection = z.infer<typeof TeamSelectionSchema>;
```

---

### Area 2.2: ADOS Board Query Response Validation

In [QueryClient.ts](file:///root/ados-helper/src/shared/api/query/QueryClient.ts), the application executes WIQL (Work Item Query Language) requests and receives the raw rows and column mappings.

**Proposed Schema (`QueryResponseDtoSchema`):**

```typescript
export const QueryResponseDtoSchema = z.object({
  payload: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.union([z.string(), z.number()]))),
  }),
  sourceIds: z.array(z.number()),
});
```

---

### Area 2.3: Work Item Details Validation

In [WorkItemDto.ts](file:///root/ados-helper/src/shared/api/query/WorkItemDto.ts), we represent the hierarchical layout of work items returned by Azure DevOps. Because it contains recursive self-referential children, we will define a lazy schema.

**Proposed Schema (`WorkItemDtoSchema`):**

```typescript
const BaseWorkItemDtoSchema = z.object({
  Microsoft: z.object({
    VSTS: z.object({
      Common: z
        .object({
          ActivatedDate: z.string().optional(),
        })
        .optional(),
      Scheduling: z.object({
        Effort: z.number().default(0),
        RemainingWork: z.number().optional(),
        OriginalEstimate: z.number().optional(),
        CompletedWork: z.number().optional(),
      }),
    }),
  }),
  System: z.object({
    Id: z.number(),
    WorkItemType: z.string(),
    TeamProject: z.string(),
    Rev: z.number(),
    Tags: z.string().default(""),
    State: z.string(),
    AssignedTo: z.string().nullable().default(null),
    Title: z.string(),
    IterationPath: z.string(),
    HyperLinkCount: z.number().default(0),
  }),
  links: z.array(z.string()).default([]),
});

// Recursive check for children
export type WorkItemDto = z.infer<typeof BaseWorkItemDtoSchema> & {
  children: WorkItemDto[];
};

export const WorkItemDtoSchema: z.ZodType<WorkItemDto> =
  BaseWorkItemDtoSchema.extend({
    children: z.lazy(() => z.array(WorkItemDtoSchema)),
  });
```

---

## 3. Step-by-Step Implementation Guide

### Step 3.1: Add Dependencies

Install `zod` in [package.json](file:///root/ados-helper/package.json):

```bash
pnpm add zod
```

### Step 3.2: Implement local storage schema parsing

Modify `loadTeamsFromStorage` in [MultiTeamTab.tsx](file:///root/ados-helper/src/shared/components/MultiTeamTab.tsx#L76):

- Parse with `TeamSelectionArraySchema.safeParse`.
- If validation fails, log the parsing error to console and return `null` (falling back to initial values or requesting configuration recreate).

### Step 3.3: Implement API Client Response Checks

1. Update [QueryClient.ts](file:///root/ados-helper/src/shared/api/query/QueryClient.ts) and [WorkItemClient.ts](file:///root/ados-helper/src/shared/api/workItems/WorkItemClient.ts) to run `safeParse` on the response payloads from `fetch`.
2. Wrap the API parses with custom errors so that errors during API response processing are clearly flagged (e.g. `DevOpsApiValidationError`).

### Step 3.4: Integrate validation inside Tauri Desktop Renderer

Verify Tauri IPC message payloads (like organization list fetches) in `useAdoState.ts` using schemas to ensure that standard Tauri frontend-backend bridge communication handles schema drift safely.

---

## 4. Testing & Verification

1. **Unit Tests:** Add target mock data payloads in `tests` which simulate outdated, corrupt, or invalid shapes to verify that the schema parser fails gracefully.
2. **Integration Verification:** Run the sandbox environment (`pnpm dev`) and toggle scenarios in the dashboard to ensure the Zod integration does not impact standard board/query workflows.
