import { describe, expect, test } from "vitest";
import { namesMatch } from "./namesMatch";

describe("namesMatch", () => {
  test.each([
    ["Dan K", "Dan K"],
    ["Dan K", "Dan Kennedy"],
    ["Dan K", "Daniel Kennedy"],
    ["Dan K", "Daniel E Kennedy"],
    ["Daniel K", "Dan K"],
    ["Daniel K", "Dan Kennedy"],
    ["Daniel K", "Daniel Kennedy"],
    ["Danirl K", "Daniel E Kennedy"],
    ["Kennedy, Daniel E", "Dan K"],
    ["Daniel Kennedy <dan@example.com>", "Dan K"],
    ["Danny Kennedy", "Daniel Kennedy"],
    ["D Kennedy", "Daniel Kennedy"]
  ])("%s matches %s (both directions)", (a, b) => {
    expect(namesMatch(a, b)).toBe(true);
    expect(namesMatch(b, a)).toBe(true);
  });

  test.each([
    ["Dan K", "Dan Smith"],
    ["Dan K", "David Kennedy"],
    ["Daniel Kennedy", "Daniel Kent"],
    ["Dan K", "Dana Kennedy"],
    [null, "Dan K"],
    ["", "Dan K"]
  ])("%s does not match %s", (a, b) => {
    expect(namesMatch(a, b)).toBe(false);
  });
});
