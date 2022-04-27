export function encodeUrl(template: string, parameters: string[]) {
    return template.replace(/{(\d+)}/g, function(match: string, number: number) { 
        return typeof parameters[number] != "undefined"
          ? encodeURIComponent(parameters[number])
          : match;
    });
}
