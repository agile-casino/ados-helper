import { expect, test } from "vitest";
import { Cell } from "../../../src/domain/reports/Cell";

test("Cell_WhenContentIsString_CellTypeIsString", () => {
  const cell = new Cell("test");

  expect(cell.t).toBe("s");
});

test("Cell_WhenContentIsNumber_CellTypeIsNumber", () => {
  const cell = new Cell(123);

  expect(cell.t).toBe("n");
});

test("Cell_WhenContentIsBoolean_CellTypeIsBoolean", () => {
  const cell = new Cell(true);

  expect(cell.t).toBe("b");
});

test("Cell_WhenContentIsDate_CellTypeIsDate", () => {
  const cell = new Cell(new Date());

  expect(cell.t).toBe("d");
});
