import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AzureDevOpsIterationSchema, DevOpsApiValidationError, parseOrThrow, parseValueArray, RawWorkItemSchema, salvageArray, WorkItemRelationSchema, WorkItemUpdateSchema } from "./schemas";
import { WorkItemDtoSchema } from "./WorkItemDto";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("salvageArray", () => {
  it("keeps valid entries and drops invalid ones", () => {
    const result = salvageArray(z.object({ id: z.number() }), [{ id: 1 }, { id: "bad" }, { id: 3 }, null], "items");

    expect(result).toEqual([{ id: 1 }, { id: 3 }]);
  });

  it("returns [] for non-array, null and undefined", () => {
    expect(salvageArray(z.number(), undefined, "items")).toEqual([]);
    expect(salvageArray(z.number(), null, "items")).toEqual([]);
    expect(salvageArray(z.number(), "not-an-array", "items")).toEqual([]);
    expect(salvageArray(z.number(), { value: [1] }, "items")).toEqual([]);
  });
});

describe("parseValueArray", () => {
  it("reads the value envelope leniently", () => {
    expect(parseValueArray(z.number(), { value: [1, 2, "bad"] }, "items")).toEqual([1, 2]);
    expect(parseValueArray(z.number(), { value: null }, "items")).toEqual([]);
    expect(parseValueArray(z.number(), {}, "items")).toEqual([]);
    expect(parseValueArray(z.number(), null, "items")).toEqual([]);
  });
});

describe("parseOrThrow", () => {
  it("returns the parsed value on success", () => {
    expect(parseOrThrow(z.object({ id: z.string() }), { id: "abc" }, "profile")).toEqual({ id: "abc" });
  });

  it("throws DevOpsApiValidationError for top-level payloads", () => {
    expect(() => parseOrThrow(z.object({ id: z.string() }), { id: 123 }, "profile")).toThrow(DevOpsApiValidationError);
  });
});

describe("AzureDevOpsIterationSchema", () => {
  it("returns [] for missing, null or non-array values", () => {
    expect(parseValueArray(AzureDevOpsIterationSchema, {}, "iterations")).toEqual([]);
    expect(parseValueArray(AzureDevOpsIterationSchema, { value: null }, "iterations")).toEqual([]);
    expect(parseValueArray(AzureDevOpsIterationSchema, { value: "nope" }, "iterations")).toEqual([]);
  });

  it("keeps valid iterations and drops malformed ones without throwing", () => {
    const result = parseValueArray(
      AzureDevOpsIterationSchema,
      {
        value: [{ name: "Sprint 1", path: "p\\s1", attributes: { startDate: "2026-01-01" } }, { path: "no-name" }, null]
      },
      "iterations"
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Sprint 1");
  });

  it("accepts and strips unknown keys", () => {
    const parsed = AzureDevOpsIterationSchema.parse({ name: "Sprint 1", extra: "ignored" });

    expect(parsed).not.toHaveProperty("extra");
  });

  it("defaults a missing path to an empty string", () => {
    const parsed = AzureDevOpsIterationSchema.parse({ name: "Sprint 1" });

    expect(parsed.path).toBe("");
  });
});

describe("WIQL schema", () => {
  it("drops one malformed relation while keeping the rest", () => {
    const relations = salvageArray(
      WorkItemRelationSchema,
      [
        { source: { id: 1 }, target: { id: 2 } },
        { source: { id: "bad" }, target: { id: 3 } }
      ],
      "workItemRelations"
    );

    expect(relations).toHaveLength(1);
    expect(relations[0]?.source?.id).toBe(1);
  });

  it("returns [] when workItemRelations is present but not an array", () => {
    expect(salvageArray(WorkItemRelationSchema, { not: "an array" }, "workItemRelations")).toEqual([]);
  });
});

describe("RawWorkItemSchema", () => {
  it("drops an item missing an id while keeping the rest of the batch", () => {
    const items = parseValueArray(RawWorkItemSchema, { value: [{ id: 1, fields: { "System.Title": "One" } }, { fields: { "System.Title": "No id" } }] }, "workItemsBatch");

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(1);
  });

  it("accepts null scheduling fields", () => {
    const parsed = RawWorkItemSchema.parse({ id: 1, fields: { "Microsoft.VSTS.Scheduling.RemainingWork": null } });

    expect(parsed.fields?.["Microsoft.VSTS.Scheduling.RemainingWork"]).toBeNull();
  });

  it("coerces numeric strings (some on-prem processes) instead of dropping the item", () => {
    const parsed = RawWorkItemSchema.parse({
      id: 1,
      fields: { "System.Rev": "7", "System.HyperLinkCount": "2", "Microsoft.VSTS.Scheduling.Effort": "3.5" }
    });

    expect(parsed.fields?.["System.Rev"]).toBe(7);
    expect(parsed.fields?.["System.HyperLinkCount"]).toBe(2);
    expect(parsed.fields?.["Microsoft.VSTS.Scheduling.Effort"]).toBe(3.5);
  });

  it("accepts the sandbox shape with omitted Rev and HyperLinkCount", () => {
    const parsed = RawWorkItemSchema.safeParse({ id: 1, fields: { "System.Title": "Sandbox" } });

    expect(parsed.success).toBe(true);
  });
});

describe("WorkItemUpdateSchema", () => {
  it("accepts null oldValue/newValue (field cleared)", () => {
    const update = WorkItemUpdateSchema.parse({ id: 1, rev: 2, revisedDate: "2026-01-01", fields: { "System.IterationPath": { oldValue: null, newValue: "p\\s1" }, "System.State": { newValue: "Removed" } } });

    expect(update.fields?.["System.IterationPath"]?.newValue).toBe("p\\s1");
    expect(update.fields?.["System.State"]?.newValue).toBe("Removed");
  });

  it("drops one malformed update while keeping valid ones", () => {
    const updates = parseValueArray(
      WorkItemUpdateSchema,
      {
        value: [
          { id: 1, rev: 1, revisedDate: "2026-01-01" },
          { rev: 2, revisedDate: "2026-01-02" }
        ]
      },
      "updates"
    );

    expect(updates).toHaveLength(1);
    expect(updates[0]?.id).toBe(1);
  });
});

describe("WorkItemDtoSchema", () => {
  const system = {
    Id: 1,
    WorkItemType: "Product Backlog Item",
    TeamProject: "proj",
    Rev: 1,
    Tags: "",
    State: "New",
    AssignedTo: null,
    Title: "Item",
    IterationPath: "proj\\Sprint 1",
    HyperLinkCount: 0
  };

  const dto = {
    System: system,
    Microsoft: { VSTS: { Scheduling: { Effort: 3 } } },
    children: [],
    links: []
  };

  it("parses a valid DTO", () => {
    expect(WorkItemDtoSchema.safeParse(dto).success).toBe(true);
  });

  it("fails a DTO whose grandchild is malformed while sibling DTOs still parse", () => {
    const badChild = {
      ...dto,
      System: { ...system, Id: "not-a-number" }
    };
    const dtoWithBadChild = { ...dto, children: [badChild] };

    expect(WorkItemDtoSchema.safeParse(dtoWithBadChild).success).toBe(false);
    expect(WorkItemDtoSchema.safeParse(dto).success).toBe(true);
  });
});
