import { describe, expect, test } from "vitest";
import { Cell } from "./Cell";

describe("Cell", () => {
  describe("constructor", () => {
    test("sets cell type to string for string content", () => {
      const cell = new Cell("test");
      expect(cell.t).toBe("s");
      expect(cell.v).toBe("test");
    });

    test("sets cell type to number for number content", () => {
      const cell = new Cell(123);
      expect(cell.t).toBe("n");
      expect(cell.v).toBe(123);
    });

    test("sets cell type to boolean for boolean content", () => {
      const cell = new Cell(true);
      expect(cell.t).toBe("b");
      expect(cell.v).toBe(true);
    });

    test("sets cell type to date for Date content", () => {
      const date = new Date();
      const cell = new Cell(date);
      expect(cell.t).toBe("d");
      expect(cell.v).toBe(date);
    });

    test("applies default style with Calibri font", () => {
      const cell = new Cell("test");
      expect(cell.s.font?.name).toBe("Calibri");
      expect(cell.s.font?.sz).toBe(11);
    });
  });

  describe("alignText", () => {
    test("sets horizontal alignment to left", () => {
      const cell = new Cell("test").alignText({ horizontal: "left" });
      expect(cell.s.alignment?.horizontal).toBe("left");
    });

    test("sets horizontal alignment to center", () => {
      const cell = new Cell("test").alignText({ horizontal: "center" });
      expect(cell.s.alignment?.horizontal).toBe("center");
    });

    test("sets horizontal alignment to right", () => {
      const cell = new Cell("test").alignText({ horizontal: "right" });
      expect(cell.s.alignment?.horizontal).toBe("right");
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.alignText({ horizontal: "left" });
      expect(result).toBe(cell);
    });
  });

  describe("borderBottom", () => {
    test("sets bottom border color and style", () => {
      const cell = new Cell("test").borderBottom({ color: "000000", style: "thin" });
      expect(cell.s.border?.bottom?.color?.rgb).toBe("000000");
      expect(cell.s.border?.bottom?.style).toBe("thin");
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.borderBottom({ style: "thin" });
      expect(result).toBe(cell);
    });
  });

  describe("font", () => {
    test("sets font size", () => {
      const cell = new Cell("test").font({ size: 14 });
      expect(cell.s.font?.sz).toBe(14);
    });

    test("sets font bold", () => {
      const cell = new Cell("test").font({ size: 12, bold: true });
      expect(cell.s.font?.bold).toBe(true);
    });

    test("defaults bold to false", () => {
      const cell = new Cell("test").font({ size: 12 });
      expect(cell.s.font?.bold).toBe(false);
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.font({ size: 12 });
      expect(result).toBe(cell);
    });
  });

  describe("link", () => {
    test("sets hyperlink target", () => {
      const cell = new Cell("test").link("https://example.com");
      expect(cell.l?.Target).toBe("https://example.com");
    });

    test("does not set link when href is undefined", () => {
      const cell = new Cell("test").link(undefined);
      expect(cell.l).toBeUndefined();
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.link("https://example.com");
      expect(result).toBe(cell);
    });
  });

  describe("style", () => {
    test("merges custom style with existing style", () => {
      const cell = new Cell("test").style({
        fill: {
          fgColor: { rgb: "FF0000" }
        }
      });
      expect(cell.s.fill?.fgColor?.rgb).toBe("FF0000");
      expect(cell.s.font?.name).toBe("Calibri"); // default style preserved
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.style({});
      expect(result).toBe(cell);
    });
  });

  describe("backgroundColor", () => {
    test("sets fill color without hash prefix", () => {
      const cell = new Cell("test").backgroundColor("FF0000");
      expect(cell.s.fill?.fgColor?.rgb).toBe("FF0000");
    });

    test("removes hash prefix from color", () => {
      const cell = new Cell("test").backgroundColor("#FF0000");
      expect(cell.s.fill?.fgColor?.rgb).toBe("FF0000");
    });

    test("converts color to uppercase", () => {
      const cell = new Cell("test").backgroundColor("#ff00aa");
      expect(cell.s.fill?.fgColor?.rgb).toBe("FF00AA");
    });

    test("does not set fill when color is undefined", () => {
      const cell = new Cell("test").backgroundColor(undefined);
      expect(cell.s.fill).toBeUndefined();
    });

    test("returns itself for chaining", () => {
      const cell = new Cell("test");
      const result = cell.backgroundColor("#FFFFFF");
      expect(result).toBe(cell);
    });
  });

  describe("chaining", () => {
    test("allows multiple methods to be chained together", () => {
      const cell = new Cell("test").alignText({ horizontal: "center" }).font({ size: 14, bold: true }).borderBottom({ style: "thick" }).backgroundColor("#AABBCC").link("https://example.com");

      expect(cell.s.alignment?.horizontal).toBe("center");
      expect(cell.s.font?.sz).toBe(14);
      expect(cell.s.font?.bold).toBe(true);
      expect(cell.s.border?.bottom?.style).toBe("thick");
      expect(cell.s.fill?.fgColor?.rgb).toBe("AABBCC");
      expect(cell.l?.Target).toBe("https://example.com");
    });
  });
});
