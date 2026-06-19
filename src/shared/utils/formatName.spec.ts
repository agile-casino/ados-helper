import { describe, expect, test } from "vitest";
import { formatName } from "./formatName";

describe("formatName", () => {
  test("returns empty string for null input", () => {
    expect(formatName(null)).toBe("");
  });

  test("returns empty string for empty string input", () => {
    expect(formatName("")).toBe("");
  });

  test("extracts first name from 'FirstName LastName' format", () => {
    expect(formatName("John Smith")).toBe("John");
  });

  test("extracts first name from 'LastName, FirstName' format", () => {
    expect(formatName("Smith, John")).toBe("John");
  });

  test("removes email portion from name with angle brackets", () => {
    expect(formatName("John Smith <john.smith@example.com>")).toBe("John");
  });

  test("handles reversed name with email", () => {
    expect(formatName("Smith, John <john.smith@example.com>")).toBe("John");
  });

  test("extracts first name from name with middle name", () => {
    expect(formatName("John Michael Smith")).toBe("John");
  });

  test("handles reversed name with middle initial", () => {
    expect(formatName("Smith, John M.")).toBe("John");
  });

  test("returns original name if no pattern matches", () => {
    expect(formatName("SingleName")).toBe("SingleName");
  });
});
