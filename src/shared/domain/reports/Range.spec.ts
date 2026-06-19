import { describe, expect, test } from "vitest";
import { Range } from "./Range";

describe("Range", () => {
  test("initializes with default values of 0,0 for start and end", () => {
    const range = new Range();
    expect(range.s).toEqual({ r: 0, c: 0 });
    expect(range.e).toEqual({ r: 0, c: 0 });
  });

  describe("from", () => {
    test("sets start row and column", () => {
      const range = new Range().from(5, 3);
      expect(range.s).toEqual({ r: 5, c: 3 });
    });

    test("returns itself for chaining", () => {
      const range = new Range();
      const result = range.from(1, 2);
      expect(result).toBe(range);
    });
  });

  describe("to", () => {
    test("sets end row and column", () => {
      const range = new Range().to(10, 8);
      expect(range.e).toEqual({ r: 10, c: 8 });
    });

    test("returns itself for chaining", () => {
      const range = new Range();
      const result = range.to(5, 6);
      expect(result).toBe(range);
    });
  });

  describe("chaining", () => {
    test("allows from and to to be chained", () => {
      const range = new Range().from(1, 2).to(5, 6);
      expect(range.s).toEqual({ r: 1, c: 2 });
      expect(range.e).toEqual({ r: 5, c: 6 });
    });

    test("allows to and from to be chained in any order", () => {
      const range = new Range().to(10, 10).from(5, 5);
      expect(range.s).toEqual({ r: 5, c: 5 });
      expect(range.e).toEqual({ r: 10, c: 10 });
    });
  });
});
