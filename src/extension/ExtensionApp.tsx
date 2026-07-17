import { MantineProvider, Tabs, Title } from "@mantine/core";
import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import { createAuthFetch } from "../shared/api/authFetch";
import { CurrentTeamTab } from "../shared/components/CurrentTeamTab";
import { MultiTeamTab } from "../shared/components/MultiTeamTab";
import { SprintStatsTab } from "../shared/components/SprintStatsTab";
import { PlatformProvider } from "../shared/context/PlatformContext";
import { ExtensionPlatformService } from "./ExtensionPlatformService";

// Import Mantine Styles for the extension package
// @ts-expect-error Mantine styles CSS module
import "../shared/styles/mantine.css";

const platformService = new ExtensionPlatformService();

interface ExtensionContext {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
}

const isColorDark = (color: string): boolean => {
  if (!color) return false;
  const cleanColor = color.trim().toLowerCase();

  if (cleanColor.startsWith("#")) {
    const hex = cleanColor.slice(1);
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 3) {
      const rChar = hex[0];
      const gChar = hex[1];
      const bChar = hex[2];
      if (rChar && gChar && bChar) {
        r = parseInt(rChar + rChar, 16);
        g = parseInt(gChar + gChar, 16);
        b = parseInt(bChar + bChar, 16);
      }
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return false;
    }
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness < 128;
  }

  if (cleanColor.startsWith("rgb")) {
    const matches = cleanColor.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const rStr = matches[0];
      const gStr = matches[1];
      const bStr = matches[2];
      if (rStr && gStr && bStr) {
        const r = parseInt(rStr, 10);
        const g = parseInt(gStr, 10);
        const b = parseInt(bStr, 10);
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        return brightness < 128;
      }
    }
  }

  const darkNames = ["black", "dark", "navy", "purple", "indigo", "maroon", "blue", "grey", "gray"];
  if (darkNames.some(name => cleanColor.includes(name))) {
    return true;
  }

  return false;
};

const detectTheme = (): "light" | "dark" => {
  const rootStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);

  const bgColor = rootStyle.getPropertyValue("--background-color").trim() || bodyStyle.getPropertyValue("--background-color").trim();

  const textColor = rootStyle.getPropertyValue("--text-primary-color").trim() || bodyStyle.getPropertyValue("--text-primary-color").trim();

  if (bgColor) {
    return isColorDark(bgColor) ? "dark" : "light";
  }

  if (textColor) {
    return isColorDark(textColor) ? "light" : "dark";
  }

  return "light";
};

export const ExtensionApp = () => {
  const [loading, setLoading] = React.useState(true);
  const [context, setContext] = React.useState<ExtensionContext | null>(null);
  const [colorScheme, setColorScheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    async function initContext() {
      // 1. Resolve ADOS context details
      const hostContext = SDK.getHost();
      const collection = hostContext.name || "DefaultCollection";

      let origin = "https://dev.azure.com";
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          // If on-premises TFS, the path might be /tfs/CollectionName/Project/...
          // We want to extract everything up to the collection name as the origin/base URL.
          const collectionLower = collection.toLowerCase();
          const pathSegments = refUrl.pathname.split("/").filter(Boolean);
          const collectionIndex = pathSegments.findIndex(seg => decodeURIComponent(seg).toLowerCase() === collectionLower);

          if (collectionIndex !== -1) {
            // Keep segments before the collection name, e.g., ["tfs"]
            const prefixSegments = pathSegments.slice(0, collectionIndex);
            const pathPrefix = prefixSegments.length > 0 ? `/${prefixSegments.join("/")}` : "";
            origin = `${refUrl.origin}${pathPrefix}`;
          } else {
            origin = refUrl.origin;
          }
        } catch (e) {
          console.warn("Failed to resolve origin from document.referrer:", e);
        }
      }

      const webContext = SDK.getWebContext();
      const project = webContext?.project?.name || "";
      const team = webContext?.team?.name || "";

      // 2. Resolve current iteration/sprint details from page configuration
      const config = SDK.getConfiguration();
      let sprint = "Sprint 1";
      let iterationPath = "Sprint 1";

      const iterationObj = config["iteration"];
      if (iterationObj) {
        sprint = iterationObj["name"] || "";
        const rawPath = iterationObj["path"] || ""; // e.g. "ProjectName\\2W\\Sprint 13"
        const prefix = `${project}\\`;
        if (rawPath.toLowerCase().startsWith(prefix.toLowerCase())) {
          iterationPath = rawPath.substring(prefix.length).replace(/\\/g, "/");
        } else {
          iterationPath = rawPath.replace(/\\/g, "/");
        }
      }

      setContext({
        origin,
        collection,
        project,
        team,
        sprint,
        iterationPath
      });
      setColorScheme(detectTheme());
      setLoading(false);

      // Notify ADOS host that extension page loaded successfully
      SDK.notifyLoadSucceeded();
    }

    initContext().catch(err => {
      console.error("Failed to initialize extension context:", err);
      setLoading(false);
    });

    const handleThemeApplied = () => {
      setColorScheme(detectTheme());
    };

    window.addEventListener("themeApplied", handleThemeApplied);
    return () => {
      window.removeEventListener("themeApplied", handleThemeApplied);
    };
  }, []);

  const authFetch = React.useMemo(() => createAuthFetch(() => SDK.getAccessToken()), []);

  if (loading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading Sprint Report Generator context...</div>;
  }

  if (!context) {
    return <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>Error: Could not load ADOS context.</div>;
  }

  return (
    <PlatformProvider value={platformService}>
      <MantineProvider forceColorScheme={colorScheme}>
        <div style={{ padding: "16px", height: "100vh", display: "flex", flexDirection: "column" }}>
          <Title order={3} fw={400} style={{ marginBottom: "1rem" }}>
            <span>{context.sprint} Reports</span>
          </Title>

          <Tabs defaultValue="current-team" style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Tabs.List>
              <Tabs.Tab value="current-team">Current Team</Tabs.Tab>
              <Tabs.Tab value="multi-team">Multi-Team</Tabs.Tab>
              <Tabs.Tab value="sprint-stats">Sprint Stats</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="current-team" pt="md" style={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
              <CurrentTeamTab origin={context.origin} collection={context.collection} project={context.project} team={context.team} sprint={context.sprint} iterationPath={context.iterationPath} fetchFn={authFetch} />
            </Tabs.Panel>

            <Tabs.Panel value="multi-team" pt="md" style={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
              <MultiTeamTab origin={context.origin} collection={context.collection} project={context.project} currentTeam={context.team} sprint={context.sprint} iterationPath={context.iterationPath} fetchFn={authFetch} />
            </Tabs.Panel>

            <Tabs.Panel value="sprint-stats" pt="md" style={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
              <SprintStatsTab origin={context.origin} collection={context.collection} project={context.project} team={context.team} sprint={context.sprint} iterationPath={context.iterationPath} fetchFn={authFetch} />
            </Tabs.Panel>
          </Tabs>
        </div>
      </MantineProvider>
    </PlatformProvider>
  );
};
