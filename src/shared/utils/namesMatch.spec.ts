import { describe, expect, test } from "vitest";
import { namesMatch } from "./namesMatch";

describe("namesMatch", () => {
  test.each([
    ["Will T", "Will T"],
    ["Will T", "Will Turner"],
    ["Will T", "William Turner"],
    ["Will T", "William E Turner"],
    ["William T", "Will T"],
    ["William T", "Will Turner"],
    ["William T", "William Turner"],
    ["Wiliam T", "William E Turner"],
    ["Turner, William E", "Will T"],
    ["William Turner <will@example.com>", "Will T"],
    ["Billy Turner", "William Turner"],
    ["W Turner", "William Turner"]
  ])("%s matches %s (both directions)", (a, b) => {
    expect(namesMatch(a, b)).toBe(true);
    expect(namesMatch(b, a)).toBe(true);
  });

  test.each([
    ["Will T", "Will Baker"],
    ["Will T", "Wesley Turner"],
    ["William Turner", "William Tucker"],
    ["Will T", "Wilma Turner"],
    [null, "Will T"],
    ["", "Will T"]
  ])("%s does not match %s", (a, b) => {
    expect(namesMatch(a, b)).toBe(false);
  });
});
