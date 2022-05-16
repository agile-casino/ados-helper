export function formatName(name: string): string {
    if (name) {
        name = name.replace(/\s*<.+/, "");

        const match = name.match(/^(\w+), (\w+).*$/)

        if (match) {
            return `${match[2]} ${match[1]}`;
        }
    }
    return name;
}
