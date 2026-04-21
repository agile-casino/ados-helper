import { describe, expect, test } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  describe("sprintName", () => {
    test("extracts sprint name from tag like 'Sprint 23'", () => {
      const tag = new Tag("Sprint 23");
      expect(tag.sprintName).toBe("Sprint 23");
    });

    test("extracts sprint name from tag with suffix like 'Sprint 23+'", () => {
      const tag = new Tag("Sprint 23+");
      expect(tag.sprintName).toBe("Sprint 23");
    });

    test("extracts sprint name from tag with text around it", () => {
      const tag = new Tag("Team Alpha Sprint 42 Iteration");
      expect(tag.sprintName).toBe("Sprint 42");
    });

    test("returns undefined for tag without sprint pattern", () => {
      const tag = new Tag("some-other-tag");
      expect(tag.sprintName).toBeUndefined();
    });

    test("returns undefined for empty tag", () => {
      const tag = new Tag("");
      expect(tag.sprintName).toBeUndefined();
    });
  });

  describe("sprintNumber", () => {
    test("extracts sprint number from tag like 'Sprint 23'", () => {
      const tag = new Tag("Sprint 23");
      expect(tag.sprintNumber).toBe(23);
    });

    test("extracts sprint number from tag with suffix", () => {
      const tag = new Tag("Sprint 42-");
      expect(tag.sprintNumber).toBe(42);
    });

    test("extracts sprint number from multi-digit sprint", () => {
      const tag = new Tag("Sprint 123");
      expect(tag.sprintNumber).toBe(123);
    });

    test("returns undefined for tag without sprint pattern", () => {
      const tag = new Tag("Feature");
      expect(tag.sprintNumber).toBeUndefined();
    });

    test("returns undefined when sprint has no number", () => {
      const tag = new Tag("Sprint");
      expect(tag.sprintNumber).toBeUndefined();
    });
  });

  describe("sprintSuffix", () => {
    test("extracts minus suffix from tag like 'Sprint 23-'", () => {
      const tag = new Tag("Sprint 23-");
      expect(tag.sprintSuffix).toBe("-");
    });

    test("extracts plus suffix from tag like 'Sprint 23+'", () => {
      const tag = new Tag("Sprint 23+");
      expect(tag.sprintSuffix).toBe("+");
    });

    test("extracts exclamation suffix from tag like 'Sprint 23!'", () => {
      const tag = new Tag("Sprint 23!");
      expect(tag.sprintSuffix).toBe("!");
    });

    test("returns undefined for tag without suffix", () => {
      const tag = new Tag("Sprint 23");
      expect(tag.sprintSuffix).toBeUndefined();
    });

    test("returns undefined for tag without sprint pattern", () => {
      const tag = new Tag("some-tag");
      expect(tag.sprintSuffix).toBeUndefined();
    });
  });

  describe("text property", () => {
    test("preserves original text", () => {
      const tag = new Tag("Sprint 23+");
      expect(tag.text).toBe("Sprint 23+");
    });
  });
});
