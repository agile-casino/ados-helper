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
