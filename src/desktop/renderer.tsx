import { ActionIcon, Alert, Box, Button, Card, Group, MantineProvider, Select, Stack, Tabs, Text, TextInput, Title, useMantineColorScheme } from "@mantine/core";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { CurrentTeamTab } from "../shared/components/CurrentTeamTab";
import { MultiTeamTab } from "../shared/components/MultiTeamTab";
import { SprintStatsTab } from "../shared/components/SprintStatsTab";
import { PlatformProvider } from "../shared/context/PlatformContext";
import { isTauri } from "../shared/utils/isTauri";
import { TauriPlatformService } from "./TauriPlatformService";
import { useAdoState } from "./useAdoState";

const platformService = new TauriPlatformService();

import "../shared/styles/mantine.css";

interface TauriFetchResponse {
  body: string | null;
  status: number;
  status_text: string;
  headers: Record<string, string>;
  redirected: boolean;
  url: string;
}

// Declare global type for desktopAPI context bridge
declare global {
  interface Window {
    desktopAPI: {
      triggerLogin: (organization: string) => Promise<void>;
      checkAuthState: () => Promise<boolean>;
      clearSession: () => Promise<boolean>;
      getOrganizations: () => Promise<Array<{ name: string; uri: string }>>;
      onLoginStatusChanged: (callback: (loggedIn: boolean) => void) => () => void;
    };
  }
}

if (isTauri && !window.desktopAPI) {
  window.desktopAPI = {
    triggerLogin: async (organization: string) => {
      await invoke("trigger_login", { org: organization });
    },
    checkAuthState: async () => {
      return await invoke("check_auth_state");
    },
    clearSession: async () => {
      await invoke("clear_session");
      return true;
    },
    getOrganizations: async () => {
      try {
        const profileUrl = "https://vssps.dev.azure.com/_apis/profile/profiles/me?api-version=6.0";
        const profileRes = await fetch(profileUrl);
        if (!profileRes.ok) {
          throw new Error(`Profile fetch failed: ${profileRes.status} ${profileRes.statusText}`);
        }
        const profile = await profileRes.json();
        if (!profile?.id) {
          throw new Error("Failed to retrieve profile ID");
        }

        const accountsUrl = `https://vssps.dev.azure.com/_apis/accounts?memberId=${profile.id}&api-version=6.0`;
        const accountsRes = await fetch(accountsUrl);
        if (!accountsRes.ok) {
          throw new Error(`Accounts fetch failed: ${accountsRes.status} ${accountsRes.statusText}`);
        }
        const accountsData = await accountsRes.json();

        if (accountsData?.value) {
          return accountsData.value.map((acc: { accountName: string; accountUri: string }) => ({
            name: acc.accountName,
            uri: acc.accountUri
          }));
        }
        return [];
      } catch (err) {
        console.error("Error fetching organizations in Tauri:", err);
        return [];
      }
    },
    onLoginStatusChanged: (callback: (loggedIn: boolean) => void) => {
      let unlisten: (() => void) | null = null;
      listen("login-status-changed", (event: { payload: unknown }) => {
        callback(event.payload as boolean);
      }).then(fn => {
        unlisten = fn;
      });
      return () => {
        if (unlisten) {
          unlisten();
        }
      };
    }
  };
}

// Global fetch interceptor to detect token expiration / authentication failures
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isAdoUrl = url.includes("dev.azure.com") || url.includes("vssps.dev.azure.com");

  if (isTauri && isAdoUrl) {
    try {
      const headersObj: Record<string, string> = {};
      if (init?.headers) {
        const headers = new Headers(init.headers);
        headers.forEach((value, key) => {
          headersObj[key] = value;
        });
      }

      const tauriResponse = await invoke<TauriFetchResponse>("fetch_from_ado", {
        url,
        method: init?.method || "GET",
        headers: Object.keys(headersObj).length > 0 ? headersObj : null,
        body: init?.body ? String(init.body) : null
      });

      const response = new Response(tauriResponse.body, {
        status: tauriResponse.status,
        statusText: tauriResponse.status_text,
        headers: new Headers(tauriResponse.headers)
      });

      const contentType = response.headers.get("content-type");
      const isHtml = contentType?.includes("text/html");
      let isAuthError = response.status === 401 || response.status === 203;

      if (tauriResponse.redirected) {
        const redirectUrl = tauriResponse.url;
        if (redirectUrl.includes("login.microsoftonline.com") || redirectUrl.includes("live.com") || redirectUrl.includes("/signin")) {
          isAuthError = true;
        }
      }

      if (!isAuthError && isHtml && (url.includes("/_apis/") || url.includes("/_api/"))) {
        isAuthError = true;
      }

      if (isAuthError) {
        console.warn("Authentication expiration detected via fetch to:", url);
        window.dispatchEvent(new CustomEvent("ados-auth-expired"));
        return new Response(JSON.stringify({ error: "Unauthorized", message: "Azure DevOps session expired" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: new Headers({ "Content-Type": "application/json" })
        });
      }

      return response;
    } catch (error) {
      console.error("Tauri fetch error:", error);
      throw error;
    }
  }

  try {
    const response = await originalFetch(input, init);
    if (isAdoUrl) {
      const contentType = response.headers.get("content-type");
      const isHtml = contentType?.includes("text/html");
      let isAuthError = response.status === 401 || response.status === 203;

      if (!isAuthError && response.redirected) {
        const redirectUrl = response.url;
        if (redirectUrl.includes("login.microsoftonline.com") || redirectUrl.includes("live.com") || redirectUrl.includes("/signin")) {
          isAuthError = true;
        }
      }

      if (!isAuthError && isHtml && (url.includes("/_apis/") || url.includes("/_api/"))) {
        isAuthError = true;
      }

      if (isAuthError) {
        console.warn("Authentication expiration detected via fetch to:", url);
        window.dispatchEvent(new CustomEvent("ados-auth-expired"));
        return new Response(JSON.stringify({ error: "Unauthorized", message: "Azure DevOps session expired" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: new Headers({ "Content-Type": "application/json" })
        });
      }
    }
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const useAutoUpdater = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPortableApp, setIsPortableApp] = useState(false);

  useEffect(() => {
    if (!isTauri) return;

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) {
          setNewVersion(update.version);

          // Check if running as a portable/bare .exe outside AppData
          const portable = await invoke<boolean>("is_portable");
          setIsPortableApp(portable);

          if (portable) {
            // For portable app, notify the user without downloading in the background
            setUpdateReady(true);
          } else {
            setIsUpdating(true);
            // Download and install silently in the background for installed app
            await update.downloadAndInstall();
            setUpdateReady(true);
          }
        }
      } catch (err) {
        console.error("Failed checking or downloading updates:", err);
      } finally {
        setIsUpdating(false);
      }
    }
    checkForUpdates();
  }, []);

  const handleRelaunch = async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error("Failed to relaunch application:", err);
    }
  };

  const handleOpenReleasePage = async () => {
    try {
      await invoke("open_url", { url: "https://github.com/archerax/ados-helper/releases" });
    } catch (err) {
      console.error("Failed to open release page:", err);
    }
  };

  return { updateReady, newVersion, isUpdating, isPortableApp, handleRelaunch, handleOpenReleasePage };
};

const DesktopAppContent = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { updateReady, newVersion, isPortableApp, handleRelaunch, handleOpenReleasePage } = useAutoUpdater();
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    if (isTauri) {
      getVersion()
        .then(setAppVersion)
        .catch(err => console.error("Failed to get app version:", err));
    }
  }, []);

  const cycleColorScheme = () => {
    if (colorScheme === "light") {
      setColorScheme("dark");
    } else if (colorScheme === "dark") {
      setColorScheme("auto");
    } else {
      setColorScheme("light");
    }
  };

  const {
    isAuthenticated,
    authError,
    org,
    setOrg,
    organizations,
    customOrg,
    useCustomOrg,
    setUseCustomOrg,
    projects,
    selectedProject,
    setSelectedProject,
    teams,
    selectedTeam,
    setSelectedTeam,
    sprints,
    selectedSprint,
    setSelectedSprint,
    loadingProjects,
    loadingTeams,
    loadingSprints,
    handleSelectChange,
    handleCustomOrgChange,
    handleOrgChange,
    handleSignIn,
    handleSignOut,
    selectedSprintObj
  } = useAdoState();

  const origin = "https://dev.azure.com";
  const collection = org;

  return (
    <Stack gap={0} style={{ height: "100vh", overflow: "hidden" }}>
      {updateReady && (
        <Alert color="teal" title="✨ Update Available" withCloseButton={false} styles={{ root: { flexShrink: 0, borderRadius: 0 } }}>
          <Group justify="space-between">
            {isPortableApp ? (
              <>
                <Text size="sm">
                  Version <b>{newVersion}</b> is now available. Click to download the latest release from GitHub.
                </Text>
                <Button size="xs" color="teal" onClick={handleOpenReleasePage}>
                  Go to Downloads
                </Button>
              </>
            ) : (
              <>
                <Text size="sm">
                  Version <b>{newVersion}</b> has been downloaded in the background. Restart the app to apply.
                </Text>
                <Button size="xs" color="teal" onClick={handleRelaunch}>
                  Restart Now
                </Button>
              </>
            )}
          </Group>
        </Alert>
      )}
      {/* Header Bar */}
      <Group
        px="md"
        py="xs"
        justify="space-between"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
          backgroundColor: "var(--mantine-color-body)",
          zIndex: 100,
          flexShrink: 0
        }}
      >
        <Group gap="xs" align="baseline">
          <Text fw={700} size="md" style={{ letterSpacing: "-0.2px" }}>
            Sprint Report Generator
          </Text>
          {appVersion && (
            <Text size="xs" c="dimmed">
              v{appVersion}
            </Text>
          )}
        </Group>

        <Group gap="sm">
          {isAuthenticated && organizations.length > 1 && <Select size="xs" w={180} placeholder="Change Org" value={org} onChange={handleOrgChange} data={organizations} allowDeselect={false} />}
          {isAuthenticated && (
            <Button variant="outline" color="red" size="xs" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
          <ActionIcon
            onClick={cycleColorScheme}
            variant="default"
            size="md"
            title={colorScheme === "light" ? "Theme: Light (click to switch to Dark)" : colorScheme === "dark" ? "Theme: Dark (click to switch to System/Auto)" : "Theme: System/Auto (click to switch to Light)"}
            aria-label="Toggle dark/light/system mode"
          >
            {colorScheme === "light" ? "☀️" : colorScheme === "dark" ? "🌙" : "🌓"}
          </ActionIcon>
        </Group>
      </Group>

      {/* Main Content Area */}
      <Box style={{ flex: 1, overflow: "hidden" }}>
        {isAuthenticated === null ? (
          <Group justify="center" align="center" style={{ height: "100%" }}>
            <Text>Checking authentication status...</Text>
          </Group>
        ) : !isAuthenticated ? (
          <Group justify="center" align="center" style={{ height: "100%", backgroundColor: "var(--mantine-color-default-hover)" }}>
            <Card w={400} p="xl" shadow="md" withBorder>
              <Stack gap="md">
                <Title order={3} ta="center">
                  Sprint Report Generator
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  Standalone authentication & report tool
                </Text>

                {authError && (
                  <Alert color="red" title="Session Expired" variant="light">
                    {authError}
                  </Alert>
                )}

                {!useCustomOrg && organizations.length > 0 ? (
                  <Select
                    label="Select Azure DevOps Organization"
                    value={org}
                    onChange={handleSelectChange}
                    data={[...organizations.map(name => ({ value: name, label: name })), { value: "__custom__", label: "-- Use Custom / Manual --" }]}
                    allowDeselect={false}
                  />
                ) : (
                  <Stack gap="xs">
                    <TextInput
                      label="Azure DevOps Organization"
                      placeholder="Enter Organization Name"
                      value={useCustomOrg && organizations.length > 0 ? customOrg : org}
                      onChange={e => {
                        const val = e.currentTarget.value.trim();
                        if (useCustomOrg && organizations.length > 0) {
                          handleCustomOrgChange(val);
                        } else {
                          setOrg(val);
                          localStorage.setItem("sprint-report-generator-org", val);
                        }
                      }}
                    />
                    {useCustomOrg && organizations.length > 0 && (
                      <Button variant="subtle" size="xs" onClick={() => setUseCustomOrg(false)}>
                        Back to List
                      </Button>
                    )}
                  </Stack>
                )}

                <Button onClick={handleSignIn} fullWidth size="md">
                  Sign In with Microsoft
                </Button>
              </Stack>
            </Card>
          </Group>
        ) : (
          <Stack gap="md" p="md" style={{ height: "100%", overflow: "hidden" }}>
            {/* Filters Panel */}
            <Group grow align="flex-end" gap="sm">
              <Select
                label="Project"
                placeholder={loadingProjects ? "Loading..." : "Select Project"}
                data={projects}
                value={selectedProject}
                onChange={val => {
                  setSelectedProject(val);
                  setSelectedTeam(null);
                  setSelectedSprint(null);
                  if (val) {
                    localStorage.setItem(`sprint-report-generator-project-${org}`, val);
                  } else {
                    localStorage.removeItem(`sprint-report-generator-project-${org}`);
                    localStorage.removeItem(`ados-helper-project-${org}`);
                  }
                }}
                disabled={loadingProjects}
              />
              <Select
                label="Team"
                placeholder={loadingTeams ? "Loading..." : "Select Team"}
                data={teams}
                value={selectedTeam}
                onChange={val => {
                  setSelectedTeam(val);
                  setSelectedSprint(null);
                  if (val) {
                    localStorage.setItem(`sprint-report-generator-team-${org}-${selectedProject}`, val);
                  } else {
                    localStorage.removeItem(`sprint-report-generator-team-${org}-${selectedProject}`);
                    localStorage.removeItem(`ados-helper-team-${org}-${selectedProject}`);
                  }
                }}
                disabled={!selectedProject || loadingTeams}
              />
              <Select
                label="Sprint"
                placeholder={loadingSprints ? "Loading..." : "Select Sprint"}
                data={sprints.map(s => s.name)}
                value={selectedSprint}
                onChange={val => {
                  setSelectedSprint(val);
                  if (val) {
                    localStorage.setItem(`sprint-report-generator-sprint-${org}-${selectedProject}-${selectedTeam}`, val);
                  } else {
                    localStorage.removeItem(`sprint-report-generator-sprint-${org}-${selectedProject}-${selectedTeam}`);
                    localStorage.removeItem(`ados-helper-sprint-${org}-${selectedProject}-${selectedTeam}`);
                  }
                }}
                disabled={!selectedTeam || loadingSprints}
              />
            </Group>

            {/* Tab Panel */}
            {selectedProject && selectedTeam && selectedSprint && selectedSprintObj ? (
              <Tabs defaultValue="current-team" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Tabs.List>
                  <Tabs.Tab value="current-team">Current Team</Tabs.Tab>
                  <Tabs.Tab value="multi-team">Multi-Team</Tabs.Tab>
                  <Tabs.Tab value="sprint-stats">Sprint Stats</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="current-team" pt="xs" style={{ flex: 1, overflow: "hidden" }}>
                  <CurrentTeamTab origin={origin} collection={collection} project={selectedProject} team={selectedTeam} sprint={selectedSprint} iterationPath={selectedSprintObj.path} />
                </Tabs.Panel>

                <Tabs.Panel value="multi-team" pt="xs" style={{ flex: 1, overflow: "hidden" }}>
                  <MultiTeamTab origin={origin} collection={collection} project={selectedProject} currentTeam={selectedTeam} sprint={selectedSprint} iterationPath={selectedSprintObj.path} />
                </Tabs.Panel>

                <Tabs.Panel value="sprint-stats" pt="xs" style={{ flex: 1, overflow: "hidden" }}>
                  <SprintStatsTab origin={origin} collection={collection} project={selectedProject} team={selectedTeam} sprint={selectedSprint} iterationPath={selectedSprintObj.path} />
                </Tabs.Panel>
              </Tabs>
            ) : (
              <Group justify="center" align="center" style={{ flex: 1 }}>
                <Alert color="blue" title="Selection Required" w="100%">
                  Please select a Project, Team, and Sprint Iteration from the dropdowns above to load reports.
                </Alert>
              </Group>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export const DesktopApp = () => {
  return (
    <PlatformProvider value={platformService}>
      <MantineProvider defaultColorScheme="auto">
        <DesktopAppContent />
      </MantineProvider>
    </PlatformProvider>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<DesktopApp />);
}
