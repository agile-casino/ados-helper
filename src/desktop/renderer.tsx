import { ActionIcon, Alert, Box, Button, Card, Group, MantineProvider, Select, Stack, Tabs, Text, TextInput, Title, useMantineColorScheme } from "@mantine/core";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { CurrentTeamTab } from "../components/CurrentTeamTab";
import { MultiTeamTab } from "../components/MultiTeamTab";
import { isTauri } from "../utils/isTauri";

// @ts-expect-error
import "@mantine/core/styles.css";

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

  useEffect(() => {
    if (!isTauri) return;

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) {
          setNewVersion(update.version);
          setIsUpdating(true);
          // Download and install silently in the background
          await update.downloadAndInstall();
          setUpdateReady(true);
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

  return { updateReady, newVersion, isUpdating, handleRelaunch };
};

const DesktopAppContent = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { updateReady, newVersion, handleRelaunch } = useAutoUpdater();
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [org, setOrg] = useState<string>("");
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [customOrg, setCustomOrg] = useState<string>("");
  const [useCustomOrg, setUseCustomOrg] = useState<boolean>(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [sprints, setSprints] = useState<Array<{ name: string; path: string }>>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);

  const origin = "https://dev.azure.com";
  const collection = org;

  const loadOrgs = useCallback(async () => {
    try {
      const orgList = await window.desktopAPI.getOrganizations();
      if (orgList && orgList.length > 0) {
        const orgNames = orgList.map(o => o.name);
        setOrganizations(orgNames);

        // If our current org is in the list, keep it. Otherwise default to first list item
        const savedOrg = localStorage.getItem("ados-helper-org") || org;
        const match = orgNames.find(name => name.toLowerCase() === savedOrg.toLowerCase());
        if (match) {
          setOrg(match);
          setUseCustomOrg(false);
          localStorage.setItem("ados-helper-org", match);
        } else if (orgNames[0]) {
          setOrg(orgNames[0]);
          setUseCustomOrg(false);
          localStorage.setItem("ados-helper-org", orgNames[0]);
        }
      } else {
        setUseCustomOrg(true);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setUseCustomOrg(true);
    }
  }, [org]);

  // Check authentication status on startup
  useEffect(() => {
    if (typeof window === "undefined" || !window.desktopAPI) {
      console.error("Desktop API is not available.");
      setIsAuthenticated(false);
      return;
    }

    const savedOrg = localStorage.getItem("ados-helper-org");
    if (savedOrg) {
      setOrg(savedOrg);
    }

    async function checkAuth() {
      try {
        const loggedIn = await window.desktopAPI.checkAuthState();
        setIsAuthenticated(loggedIn);
        if (loggedIn) {
          loadOrgs();
        }
      } catch (err) {
        console.error("Failed to check auth state:", err);
        setIsAuthenticated(false);
      }
    }
    checkAuth();

    const handleAuthExpired = () => {
      console.log("Auth expired event received. Prompting user to re-authenticate.");
      setIsAuthenticated(false);
      setAuthError("Your Azure DevOps session has expired or is invalid. Please sign in again.");
    };

    window.addEventListener("ados-auth-expired", handleAuthExpired);

    const unsubscribe = window.desktopAPI.onLoginStatusChanged(status => {
      setIsAuthenticated(status);
      if (status) {
        setAuthError(null);
        loadOrgs();
      } else {
        setAuthError("Your Azure DevOps session has expired or is invalid. Please sign in again.");
        setProjects([]);
        setSelectedProject(null);
        setTeams([]);
        setSelectedTeam(null);
        setSprints([]);
        setSelectedSprint(null);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("ados-auth-expired", handleAuthExpired);
    };
  }, [loadOrgs]);

  // Fetch Projects when organization is loaded and authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const response = await fetch(`https://dev.azure.com/${org}/_apis/projects?api-version=6.0`);
        if (!response.ok) {
          throw new Error(`Failed to load projects: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const projectList: string[] = data.value?.map((p: { name: string }) => p.name) || [];
        setProjects(projectList);

        // Restore saved project
        const savedProject = localStorage.getItem(`ados-helper-project-${org}`);
        if (savedProject && projectList.includes(savedProject)) {
          setSelectedProject(savedProject);
        } else {
          setSelectedProject(null);
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [org, isAuthenticated]);

  // Fetch Teams when project changes
  useEffect(() => {
    if (!selectedProject || !isAuthenticated) {
      setTeams([]);
      setSelectedTeam(null);
      return;
    }
    async function loadTeams() {
      setLoadingTeams(true);
      try {
        const response = await fetch(`https://dev.azure.com/${org}/_apis/projects/${selectedProject}/teams?api-version=6.0`);
        if (!response.ok) {
          throw new Error(`Failed to load teams: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const teamList: string[] = data.value?.map((t: { name: string }) => t.name) || [];
        setTeams(teamList);

        // Restore saved team
        const savedTeam = localStorage.getItem(`ados-helper-team-${org}-${selectedProject}`);
        if (savedTeam && teamList.includes(savedTeam)) {
          setSelectedTeam(savedTeam);
        } else {
          setSelectedTeam(null);
        }
      } catch (err) {
        console.error("Error loading teams:", err);
      } finally {
        setLoadingTeams(false);
      }
    }
    loadTeams();
  }, [selectedProject, org, isAuthenticated]);

  // Fetch Sprints when team changes
  useEffect(() => {
    if (!selectedProject || !selectedTeam || !isAuthenticated) {
      setSprints([]);
      setSelectedSprint(null);
      return;
    }
    async function loadSprints() {
      setLoadingSprints(true);
      try {
        const response = await fetch(`https://dev.azure.com/${org}/${selectedProject}/${selectedTeam}/_apis/work/teamsettings/iterations?api-version=6.0`);
        if (!response.ok) {
          throw new Error(`Failed to load sprints: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const sprintList =
          data.value?.map((i: { name: string; path: string }) => {
            let path = i.path;
            const normalizedPath = path.replace(/\//g, "\\");
            const prefix = `${selectedProject}\\`.toLowerCase().replace(/\//g, "\\");
            if (normalizedPath.toLowerCase().startsWith(prefix)) {
              path = path.slice(prefix.length);
            }
            return { name: i.name, path: path };
          }) || [];
        setSprints(sprintList);

        // Restore saved sprint
        const savedSprint = localStorage.getItem(`ados-helper-sprint-${org}-${selectedProject}-${selectedTeam}`);
        if (savedSprint && sprintList.some((s: { name: string }) => s.name === savedSprint)) {
          setSelectedSprint(savedSprint);
        } else {
          setSelectedSprint(null);
        }
      } catch (err) {
        console.error("Error loading sprints:", err);
      } finally {
        setLoadingSprints(false);
      }
    }
    loadSprints();
  }, [selectedTeam, selectedProject, org, isAuthenticated]);

  const handleSelectChange = (value: string | null) => {
    if (value === "__custom__") {
      setUseCustomOrg(true);
      setCustomOrg("");
    } else if (value) {
      setOrg(value);
      localStorage.setItem("ados-helper-org", value);
      setUseCustomOrg(false);
      setSelectedProject(null);
      setSelectedTeam(null);
      setSelectedSprint(null);
    }
  };

  const handleCustomOrgChange = (value: string) => {
    setCustomOrg(value);
    setOrg(value);
    localStorage.setItem("ados-helper-org", value);
  };

  const handleOrgChange = (value: string | null) => {
    if (value) {
      setOrg(value);
      localStorage.setItem("ados-helper-org", value);
      setSelectedProject(null);
      setSelectedTeam(null);
      setSelectedSprint(null);
    }
  };

  const handleSignIn = async () => {
    if (!org) return;
    setAuthError(null);
    await window.desktopAPI.triggerLogin(org);
  };

  const handleSignOut = async () => {
    await window.desktopAPI.clearSession();
    setAuthError(null);
    setIsAuthenticated(false);
  };

  const selectedSprintObj = sprints.find(s => s.name === selectedSprint);

  return (
    <Stack gap={0} style={{ height: "100vh", overflow: "hidden" }}>
      {updateReady && (
        <Alert color="teal" title="✨ Update Available" withCloseButton={false} styles={{ root: { flexShrink: 0, borderRadius: 0 } }}>
          <Group justify="space-between">
            <Text size="sm">
              Version <b>{newVersion}</b> has been downloaded in the background. Restart the app to apply.
            </Text>
            <Button size="xs" color="teal" onClick={handleRelaunch}>
              Restart Now
            </Button>
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
                          localStorage.setItem("ados-helper-org", val);
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
                    localStorage.setItem(`ados-helper-project-${org}`, val);
                  } else {
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
                    localStorage.setItem(`ados-helper-team-${org}-${selectedProject}`, val);
                  } else {
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
                    localStorage.setItem(`ados-helper-sprint-${org}-${selectedProject}-${selectedTeam}`, val);
                  } else {
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
                </Tabs.List>

                <Tabs.Panel value="current-team" pt="xs" style={{ flex: 1, overflow: "hidden" }}>
                  <CurrentTeamTab origin={origin} collection={collection} project={selectedProject} team={selectedTeam} sprint={selectedSprint} iterationPath={selectedSprintObj.path} />
                </Tabs.Panel>

                <Tabs.Panel value="multi-team" pt="xs" style={{ flex: 1, overflow: "hidden" }}>
                  <MultiTeamTab origin={origin} collection={collection} project={selectedProject} currentTeam={selectedTeam} sprint={selectedSprint} iterationPath={selectedSprintObj.path} />
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
    <MantineProvider defaultColorScheme="auto">
      <DesktopAppContent />
    </MantineProvider>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<DesktopApp />);
}
