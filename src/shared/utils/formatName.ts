export function formatName(name: string | null): string {
  if (!name) {
    return "";
  }
  const cleanName = name.replace(/\s*<.+/, "");

  const reverseMatch = cleanName.match(/^(\w+), (\w+).*$/);

  if (reverseMatch) {
    return reverseMatch[2] ?? cleanName;
  }

  const match = cleanName.match(/^(\w+) (\w+).*$/);

  if (match) {
    return match[1] ?? cleanName;
  }

  return cleanName;
}
