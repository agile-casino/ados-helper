interface Window {
  __ADO_ORIGIN__: string | undefined;
}

declare module "*.css?inline" {
  const css: string;
  export default css;
}
