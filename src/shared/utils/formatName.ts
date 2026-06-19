export function formatName(name: string | null): string {
  if (name) {
    name = name.replace(/\s*<.+/, "");

    const reverseMatch = name.match(/^(\w+), (\w+).*$/);

    if (reverseMatch) {
      return `${reverseMatch[2]}`;
    }

    const match = name.match(/^(\w+) (\w+).*$/);

    if (match) {
      return `${match[1]}`;
    }
  }
  return name ?? "";
}
