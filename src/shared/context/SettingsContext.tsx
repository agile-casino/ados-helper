import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { WorkItemStateConfig } from "../domain/WorkItemState";
import { loadStateConfig, resetStateConfig as resetStoredStateConfig, saveStateConfig } from "../settings/stateConfigStorage";

interface SettingsContextValue {
  stateConfig: WorkItemStateConfig;
  setStateConfig: (config: WorkItemStateConfig) => void;
  resetStateConfig: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  collection: string;
  project: string;
  children: ReactNode;
}

export const SettingsProvider = ({ collection, project, children }: SettingsProviderProps) => {
  const [stateConfig, setStateConfigState] = useState<WorkItemStateConfig>(() => loadStateConfig(collection, project));

  useEffect(() => {
    setStateConfigState(loadStateConfig(collection, project));
  }, [collection, project]);

  const setStateConfig = (config: WorkItemStateConfig) => {
    setStateConfigState(config);
    saveStateConfig(collection, project, config);
  };

  const resetStateConfig = () => {
    setStateConfigState(resetStoredStateConfig(collection, project));
  };

  return <SettingsContext.Provider value={{ stateConfig, setStateConfig, resetStateConfig }}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
