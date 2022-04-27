import { encodeUrl } from "./encodeUrl";

export interface IterationsDto {
    value: IterationDto[];
}

export interface IterationDto {
    id: string;
    name: string;
    attributes: IterationAttributesDto;
}

export interface IterationAttributesDto {
    startDate: string;
    finishDate: string;
    timeFrame: "past"|"current"|"future";
}

export async function getIterations(collection: string, project: string, team: string): Promise<IterationsDto> {
    const url = encodeUrl(`${window.location.origin}/{0}/{1}/{2}/_apis/work/teamsettings/iterations?api-version5.1`, [collection, project, team]);
    const response = await fetch(url);
    return await response.json();
}

export async function getIteration(collection: string, project: string, team: string, iterationName: string): Promise<IterationDto|undefined> {
    const iterations = await getIterations(collection, project, team);
    return iterations.value.find(iteration => iteration.name === iterationName);
}
