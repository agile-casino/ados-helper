import { useCallback, useEffect, useState } from "react";

export interface Sprint {
  name: string;
  path: string;
}

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

export const useAdoState = () => {
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
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);

  const loadOrgs = useCallback(async () => {
    try {
      const orgList = await window.desktopAPI.getOrganizations();
      if (orgList && orgList.length > 0) {
        const orgNames = orgList.map(o => o.name);
        setOrganizations(orgNames);

        // If our current org is in the list, keep it. Otherwise default to first list item
        const savedOrg = localStorage.getItem("sprint-report-generator-org") || localStorage.getItem("ados-helper-org") || org;
        const match = orgNames.find(name => name.toLowerCase() === savedOrg.toLowerCase());
        if (match) {
          setOrg(match);
          setUseCustomOrg(false);
          localStorage.setItem("sprint-report-generator-org", match);
        } else if (orgNames[0]) {
          setOrg(orgNames[0]);
          setUseCustomOrg(false);
          localStorage.setItem("sprint-report-generator-org", orgNames[0]);
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

    const savedOrg = localStorage.getItem("sprint-report-generator-org") || localStorage.getItem("ados-helper-org");
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
        const savedProject = localStorage.getItem(`sprint-report-generator-project-${org}`) || localStorage.getItem(`ados-helper-project-${org}`);
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
        const savedTeam = localStorage.getItem(`sprint-report-generator-team-${org}-${selectedProject}`) || localStorage.getItem(`ados-helper-team-${org}-${selectedProject}`);
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
        const savedSprint = localStorage.getItem(`sprint-report-generator-sprint-${org}-${selectedProject}-${selectedTeam}`) || localStorage.getItem(`ados-helper-sprint-${org}-${selectedProject}-${selectedTeam}`);
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
      localStorage.setItem("sprint-report-generator-org", value);
      setUseCustomOrg(false);
      setSelectedProject(null);
      setSelectedTeam(null);
      setSelectedSprint(null);
    }
  };

  const handleCustomOrgChange = (value: string) => {
    setCustomOrg(value);
    setOrg(value);
    localStorage.setItem("sprint-report-generator-org", value);
  };

  const handleOrgChange = (value: string | null) => {
    if (value) {
      setOrg(value);
      localStorage.setItem("sprint-report-generator-org", value);
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

  return {
    isAuthenticated,
    setIsAuthenticated,
    authError,
    setAuthError,
    org,
    setOrg,
    organizations,
    setOrganizations,
    customOrg,
    setCustomOrg,
    useCustomOrg,
    setUseCustomOrg,
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    teams,
    setTeams,
    selectedTeam,
    setSelectedTeam,
    sprints,
    setSprints,
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
  };
};
