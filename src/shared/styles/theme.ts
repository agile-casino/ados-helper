import { createTheme, type MantineColorsTuple } from "@mantine/core";

const fluent: MantineColorsTuple = ["#eff6fc", "#deecf9", "#c7e0f4", "#a9d3f2", "#2b88d8", "#0078d4", "#106ebe", "#005a9e", "#004578", "#003966"];

const fluentGray: MantineColorsTuple = ["#faf9f8", "#f3f2f1", "#edebe9", "#e1dfdd", "#d2d0ce", "#c8c6c4", "#a19f9d", "#8a8886", "#605e5c", "#323130"];

const fluentDark: MantineColorsTuple = ["#ffffff", "#f3f2f1", "#c8c6c4", "#a19f9d", "#454545", "#3e3e3e", "#2d2d2d", "#252526", "#1f1f1f", "#141414"];

const fontFamily = '"Segoe UI", -apple-system, BlinkMacSystemFont, "Segoe UI Web (West European)", Roboto, "Helvetica Neue", sans-serif';

export const theme = createTheme({
  fontFamily,
  fontFamilyMonospace: '"Cascadia Code", Consolas, "Courier New", monospace',
  headings: { fontFamily, fontWeight: "600" },
  primaryColor: "fluent",
  primaryShade: 5,
  defaultRadius: "sm",
  cursorType: "default",
  focusRing: "auto",
  black: "#201f1e",
  white: "#ffffff",
  colors: {
    fluent,
    gray: fluentGray,
    dark: fluentDark
  }
});
