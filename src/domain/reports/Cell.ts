import cloneDeep from "lodash/cloneDeep";
import merge from "lodash/merge";
import { BorderType, CellObject, CellStyle, ExcelDataType, Hyperlink } from "xlsx-js-style";

export class Cell implements CellObject {

    public static defaultStyle: CellStyle = {
        font: {
            name: "Calibri",
            sz: 11
        }
    };

    public l?: Hyperlink;
    public s: CellStyle = cloneDeep(Cell.defaultStyle);
    public t: ExcelDataType = "s";
    public v?: string | number | boolean | Date;

    constructor(content: string | number | boolean | Date) {
        this.v = content;

        if (typeof(content) === "number") {
            this.t = "n";
        }
        else if (typeof(content) === "boolean") {
            this.t = "b";
        }
        else if (typeof(content) === "object" && content instanceof Date) {
            this.t = "d"
        }
    }

    public alignText({ horizontal }: { horizontal: "left" | "center" | "right"; }) {
        const patch: CellStyle = {
            alignment: {
                horizontal: horizontal
            }
        };
        this.s = merge(this.s, patch);
        return this;
    }

    public borderBottom({ color, style }: { color: string; style: BorderType; }) {
        const patch: CellStyle = {
            border: {
                bottom: {
                    color: { rgb: color },
                    style: style
                }
            }
        };
        this.s = merge(this.s, patch);
        return this;
    }

    public font({ size, bold = false }: { size: number; bold?: boolean; }) {
        const patch: CellStyle = {
            font: {
                sz: size,
                bold: bold
            }
        };
        this.s = merge(this.s, patch);
        return this;
    }

    public link(href: string|undefined) {
        if (href) {
            this.l = { Target: href };
        }
        return this;
    }

    public style(patch: CellStyle) {
        this.s = merge(this.s, patch);
        return this;
    }
}
