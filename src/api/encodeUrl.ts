export function encodeUrl(template: string, parameters: string[]) {
  return template.replace(/{(\d+)}/g, (match: string, number: number) => (typeof parameters[number] !== "undefined" ? encodeURIComponent(parameters[number]) : match));
}
