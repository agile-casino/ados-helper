import { expect, test } from "vitest";
import { encodeUrl } from "./encodeUrl";

test("encodeUrl_WithOneParameter_ReturnsEncodedUrl", () => {
  const result = encodeUrl("/foo/{0}", ["bar"]);

  expect(result).toBe("/foo/bar");
});

test("encodeUrl_WithTwoParameters_ReturnsEncodedUrl", () => {
  const result = encodeUrl("/foo/{0}/{1}", ["bar", "baz"]);

  expect(result).toBe("/foo/bar/baz");
});

test("encodeUrl_WithSpecialCharacters_EncodesUrlUnsafeCharacters", () => {
  const result = encodeUrl("/foo/{0}", ["hello world & how?"]);

  expect(result).toBe("/foo/hello%20world%20%26%20how%3F");
});

test("encodeUrl_WithMissingParameters_LeavesPlaceholderIntact", () => {
  const result = encodeUrl("/foo/{0}/{1}", ["bar"]);

  expect(result).toBe("/foo/bar/{1}");
});

test("encodeUrl_WithExtraParameters_IgnoresExtraParameters", () => {
  const result = encodeUrl("/foo/{0}", ["bar", "baz", "qux"]);

  expect(result).toBe("/foo/bar");
});

test("encodeUrl_WithDuplicatePlaceholders_ReplacesAllOccurrences", () => {
  const result = encodeUrl("/foo/{0}/bar/{0}", ["baz"]);

  expect(result).toBe("/foo/baz/bar/baz");
});

test("encodeUrl_WithEmptyStringParameter_ReplacesWithEmptyString", () => {
  const result = encodeUrl("/foo/{0}", [""]);

  expect(result).toBe("/foo/");
});

test("encodeUrl_WithNoPlaceholders_ReturnsOriginalTemplate", () => {
  const result = encodeUrl("/foo/bar", ["baz"]);

  expect(result).toBe("/foo/bar");
});
