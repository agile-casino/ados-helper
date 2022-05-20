export function RenderIf(props: { children: any, condition: boolean }) {
    return props.condition ? props.children : null;
}
