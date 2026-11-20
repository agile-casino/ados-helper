import { useQuery } from "@tanstack/react-query";
import { useSettings } from "../context/SettingsContext";
import { ApiClient } from "./ApiClient";
import { sayDoQueryKey } from "./queryKeys";
import { fetchSprintSayDo } from "./sprintSayDo";

/** Say-Do Ratio for display. `loading` is true while the snapshots are fetched. */
export interface SayDoSummary {
  percent: number | null;
  loading: boolean;
}

export interface UseSprintSayDoParams {
  origin: string;
  fetchFn?: typeof globalThis.fetch | undefined;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
  startDate?: Date | undefined;
  finishDate?: Date | undefined;
}

/**
 * Say-Do Ratio for one team's sprint. Needs the sprint dates, so it returns N/A until they are known.
 * Every tab that shows the Say-Do Ratio uses this hook, so they share one query cache and one formula.
 */
export function useSprintSayDo(params: UseSprintSayDoParams): SayDoSummary {
  const { origin, fetchFn, collection, project, team, sprint, iterationPath, startDate, finishDate } = params;
  const { stateConfig } = useSettings();
  const configKey = JSON.stringify(stateConfig.states);
  const hasDates = startDate !== undefined && finishDate !== undefined;
  const enabled = hasDates && Boolean(collection && project && team && sprint);

  const query = useQuery({
    queryKey: sayDoQueryKey(origin, collection, project, team, sprint, iterationPath, configKey),
    enabled,
    queryFn: () => {
      if (startDate === undefined || finishDate === undefined) {
        throw new Error("Sprint dates are not set");
      }
      return fetchSprintSayDo(new ApiClient(origin, fetchFn, stateConfig), { collection, project, team, sprint, iterationPath, startDate, finishDate });
    }
  });

  if (!enabled || query.isError) {
    return { percent: null, loading: false };
  }
  if (query.data) {
    return { percent: query.data.percent, loading: false };
  }
  return { percent: null, loading: true };
}
