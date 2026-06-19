import { createContext, useContext } from "react";
import type { PlatformService } from "../services/PlatformService";

const PlatformContext = createContext<PlatformService | null>(null);

export const PlatformProvider = PlatformContext.Provider;

export const usePlatform = (): PlatformService => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
};
