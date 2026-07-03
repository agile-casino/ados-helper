import { MantineProvider, Tabs, Title } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import { CurrentTeamTab } from "../shared/components/CurrentTeamTab";
import { MultiTeamTab } from "../shared/components/MultiTeamTab";
import { SprintStatsTab } from "../shared/components/SprintStatsTab";
import { PlatformProvider } from "../shared/context/PlatformContext";
import { ExtensionPlatformService } from "./ExtensionPlatformService";

// Import Mantine Styles for the extension package
// @ts-expect-error Mantine styles CSS module
import "@mantine/core/styles.css";

const platformService = new ExtensionPlatformService();

interface ExtensionContext {
  origin: string;
  collection: string;
  project: string;
  team: string;
  sprint: string;
  iterationPath: string;
}

export const ExtensionApp = () => {
  const [loading, setLoading] = React.useState(true);
  const [context, setContext] = React.useState<ExtensionContext | null>(null);

  const colorScheme = useColorScheme();

  React.useEffect(() => {
    async function initContext() {
      // 1. Retrieve the delegated authorization token from Azure DevOps
      const token = await SDK.getAccessToken();

      // 2. Set up global fetch interception in the extension's execution context
      // to transparently inject the Bearer token for all requests to ADOS APIs.
      const originalFetch = window.fetch;
      window.fetch = (input, init) => {
        let headersObj: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headersObj[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            for (const [key, value] of init.headers) {
              headersObj[key] = value;
            }
          } else {
            headersObj = { ...init.headers } as Record<string, string>;
          }
        }
        headersObj["Authorization"] = `Bearer ${token}`;
        return originalFetch(input, { ...init, headers: headersObj });
      };

      // 3. Resolve ADOS context details
      const hostContext = SDK.getHost();
      const origin = hostContext.name ? `https://dev.azure.com/${hostContext.name}` : "";
      const collection = hostContext.name || "DefaultCollection";

      const webContext = SDK.getWebContext();
      const project = webContext?.project?.name || "";
      const team = webContext?.team?.name || "";

      // 4. Resolve current iteration/sprint details from page configuration
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
      setLoading(false);

      // Notify ADOS host that extension page loaded successfully
      SDK.notifyLoadSucceeded();
    }

    initContext().catch(err => {
      console.error("Failed to initialize extension context:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading ADOS Helper context...</div>;
  }

  if (!context) {
    return <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>Error: Could not load ADOS context.</div>;
  }

  return (
    <PlatformProvider value={platformService}>
      <MantineProvider defaultColorScheme={colorScheme}>
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
              <CurrentTeamTab origin={context.origin} collection={context.collection} project={context.project} team={context.team} sprint={context.sprint} iterationPath={context.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="multi-team" pt="md" style={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
              <MultiTeamTab origin={context.origin} collection={context.collection} project={context.project} currentTeam={context.team} sprint={context.sprint} iterationPath={context.iterationPath} />
            </Tabs.Panel>

            <Tabs.Panel value="sprint-stats" pt="md" style={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
              <SprintStatsTab origin={context.origin} collection={context.collection} project={context.project} team={context.team} sprint={context.sprint} iterationPath={context.iterationPath} />
            </Tabs.Panel>
          </Tabs>
        </div>
      </MantineProvider>
    </PlatformProvider>
  );
};
