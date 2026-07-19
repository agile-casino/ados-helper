// @vitest-environment happy-dom

import { beforeEach, describe, expect, test } from "vitest";
import { isColorDark, resolveOrigin } from "./ExtensionApp";

describe("isColorDark", () => {
  test("returns false for empty string", () => {
    expect(isColorDark("")).toBe(false);
  });

  test("returns true for black hex", () => {
    expect(isColorDark("#000000")).toBe(true);
  });

  test("returns false for white hex", () => {
    expect(isColorDark("#FFFFFF")).toBe(false);
  });

  test("handles 3-digit hex", () => {
    expect(isColorDark("#000")).toBe(true);
    expect(isColorDark("#FFF")).toBe(false);
  });

  test("handles rgb strings", () => {
    expect(isColorDark("rgb(0, 0, 0)")).toBe(true);
    expect(isColorDark("rgb(255, 255, 255)")).toBe(false);
  });

  test("detects dark color names", () => {
    expect(isColorDark("black")).toBe(true);
    expect(isColorDark("navy")).toBe(true);
  });

  test("detects light color names", () => {
    expect(isColorDark("white")).toBe(false);
    expect(isColorDark("yellow")).toBe(false);
  });

  test("is case insensitive", () => {
    expect(isColorDark("#000000")).toBe(true);
    expect(isColorDark("#FfFfFf")).toBe(false);
  });

  test("trims whitespace", () => {
    expect(isColorDark("  #000000  ")).toBe(true);
  });
});

describe("resolveOrigin", () => {
  beforeEach(() => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: ""
    });
  });

  test("defaults to https://dev.azure.com when no referrer", () => {
    expect(resolveOrigin("MyCollection")).toBe("https://dev.azure.com");
  });

  test("extracts origin from hosted referrer URL", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://dev.azure.com/MyOrg/MyProject/_sprints/taskboard/MyTeam/MySprint"
    });
    expect(resolveOrigin("DefaultCollection")).toBe("https://dev.azure.com");
  });

  test("extracts on-prem origin with collection in path", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://tfs.example.com/tfs/MyCollection/MyProject/_sprints/taskboard"
    });
    expect(resolveOrigin("MyCollection")).toBe("https://tfs.example.com/tfs");
  });

  test("extracts on-prem origin without collection prefix", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://tfs.example.com/MyCollection/MyProject/_sprints/taskboard"
    });
    expect(resolveOrigin("MyCollection")).toBe("https://tfs.example.com");
  });

  test("handles case-insensitive collection matching", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://tfs.example.com/tfs/DefaultCollection/MyProject"
    });
    expect(resolveOrigin("defaultcollection")).toBe("https://tfs.example.com/tfs");
  });

  test("handles missing collection in path", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://otherhost.example.com/some/path"
    });
    expect(resolveOrigin("MyCollection")).toBe("https://otherhost.example.com");
  });
});
