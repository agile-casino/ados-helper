// biome-ignore lint/suspicious/noExplicitAny: TODO proper typings
export function If(props: { children: any; condition: boolean }) {
  return props.condition ? props.children : null;
}
