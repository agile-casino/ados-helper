import { CellAddress, Range as IRange } from "xlsx-js-style";

export class Range implements IRange {

    public s: CellAddress = { r: 0, c: 0 };
    public e: CellAddress = { r: 0, c: 0 };

    public from(row: number, column: number) {
        this.s.r = row;
        this.s.c = column;
        return this;
    }

    public to(row: number, column: number) {
        this.e.r = row;
        this.e.c = column;
        return this;
    }
}
