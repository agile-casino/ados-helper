import { describe, expect, it } from "vitest";
import { parseAzureDate } from "./parseAzureDate";

describe("parseAzureDate", () => {
  describe("Azure DevOps legacy format (/Date(timestamp)/)", () => {
    it("should parse valid Azure DevOps date format", () => {
      const result = parseAzureDate("/Date(1764079201133)/");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(1764079201133);
    });

    it("should parse zero timestamp (epoch start)", () => {
      const result = parseAzureDate("/Date(0)/");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    });

    it("should parse timestamp for year 2026", () => {
      // January 27, 2026 00:00:00 UTC
      const result = parseAzureDate("/Date(1769299200000)/");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should return null for Azure format with invalid timestamp (too large)", () => {
      // Year 2200 - beyond our validation range
      const result = parseAzureDate("/Date(7258118400000)/");
      expect(result).toBeNull();
    });

    it("should return null for Azure format with negative timestamp", () => {
      const result = parseAzureDate("/Date(-1000)/");
      expect(result).toBeNull();
    });

    it("should return null for malformed Azure format (missing closing bracket)", () => {
      const result = parseAzureDate("/Date(1764079201133)");
      expect(result).toBeNull();
    });

    it("should return null for malformed Azure format (missing slash)", () => {
      const result = parseAzureDate("Date(1764079201133)/");
      expect(result).toBeNull();
    });

    it("should return null for Azure format with non-numeric timestamp", () => {
      const result = parseAzureDate("/Date(abc)/");
      expect(result).toBeNull();
    });

    it("should return null for Azure format with empty timestamp", () => {
      const result = parseAzureDate("/Date()/");
      expect(result).toBeNull();
    });
  });

  describe("ISO 8601 format", () => {
    it("should parse valid ISO 8601 date with time", () => {
      const result = parseAzureDate("2026-01-27T10:30:00Z");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(27);
    });

    it("should parse ISO 8601 date without timezone", () => {
      const result = parseAzureDate("2026-01-27T10:30:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse ISO 8601 date with milliseconds", () => {
      const result = parseAzureDate("2026-01-27T10:30:00.123Z");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMilliseconds()).toBe(123);
    });

    it("should parse ISO 8601 date with timezone offset", () => {
      const result = parseAzureDate("2026-01-27T10:30:00+05:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse date-only format", () => {
      const result = parseAzureDate("2026-01-27");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(27);
    });

    it("should parse legacy JavaScript date string", () => {
      const result = parseAzureDate("Mon Jan 27 2026 10:30:00 GMT+0000");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });
  });

  describe("Edge cases and invalid inputs", () => {
    it("should return null for undefined input", () => {
      const result = parseAzureDate(undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = parseAzureDate("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      const result = parseAzureDate("   ");
      expect(result).toBeNull();
    });

    it("should return null for invalid date string", () => {
      const result = parseAzureDate("not a date");
      expect(result).toBeNull();
    });

    it("should return null for malformed date", () => {
      const result = parseAzureDate("2026-13-45"); // Invalid month and day
      expect(result).toBeNull();
    });

    it("should return null for date with invalid year (too old)", () => {
      const result = parseAzureDate("1800-01-01");
      expect(result).toBeNull();
    });

    it("should return null for date with invalid year (too far in future)", () => {
      const result = parseAzureDate("2150-01-01");
      expect(result).toBeNull();
    });

    it("should handle date at lower boundary (1900)", () => {
      const result = parseAzureDate("1900-01-01");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1900);
    });

    it("should handle date at upper boundary (2100)", () => {
      const result = parseAzureDate("2100-01-01");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2100);
    });

    it("should return null for JavaScript Date.toString() of invalid date", () => {
      const result = parseAzureDate("Invalid Date");
      expect(result).toBeNull();
    });

    it("should return null for numeric string that is not a timestamp", () => {
      const result = parseAzureDate("12345");
      expect(result).toBeNull();
    });
  });

  describe("Real-world Azure DevOps dates", () => {
    it("should parse actual created date from test data", () => {
      // From the test file WorkItemCollection.commitment.spec.ts
      const result = parseAzureDate("2026-01-13T08:00:00Z");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2026-01-13T08:00:00.000Z");
    });

    it("should handle date parsing consistently with original implementation", () => {
      // Test the actual timestamp from the project
      const result = parseAzureDate("/Date(1764079201133)/");
      expect(result).toBeInstanceOf(Date);

      // Verify it's the same as direct Date constructor
      const direct = new Date(1764079201133);
      expect(result?.getTime()).toBe(direct.getTime());
    });
  });

  describe("Return type consistency", () => {
    it("should return Date or null, never undefined", () => {
      const validResult = parseAzureDate("2026-01-27");
      expect(validResult === null || validResult instanceof Date).toBe(true);

      const invalidResult = parseAzureDate("invalid");
      expect(invalidResult === null || invalidResult instanceof Date).toBe(true);

      const undefinedResult = parseAzureDate(undefined);
      expect(undefinedResult === null || undefinedResult instanceof Date).toBe(true);
    });

    it("should never return an invalid Date object", () => {
      const result = parseAzureDate("invalid date string");
      if (result !== null) {
        expect(Number.isNaN(result.getTime())).toBe(false);
      } else {
        expect(result).toBeNull();
      }
    });
  });
});
