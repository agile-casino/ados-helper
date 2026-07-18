interface MockWorkItem {
  id: number;
  type: "Product Backlog Item" | "Bug" | "Task";
  title: string;
  state: "New" | "Approved" | "Committed" | "In Progress" | "Done" | "Staging" | "Released" | "Removed" | "To Do";
  assignedTo: string | null;
  tags?: string;
  effort?: number;
  activatedDate?: string;
  remainingWork?: number;
  originalEstimate?: number;
  completedWork?: number;
  children?: MockWorkItem[];
  links?: string[];
}

// Default mock data scenarios
const SCENARIOS = {
  standard: {
    name: "Standard Sprint",
    description: "Active sprint with normal mix of PBIs, tasks, and typical completion rates.",
    data: {
      "DE_BK_Green": [
        {
          id: 101,
          type: "Product Backlog Item",
          title: "[UI] Design and implement new reports view",
          state: "In Progress",
          assignedTo: "Alice Green",
          tags: "Sprint 13",
          effort: 5,
          activatedDate: "2026-06-02T09:00:00Z",
          links: ["http://mock-wise/wise/98711"],
          children: [
            { id: 102, type: "Task", title: "Create mockup designs", state: "Done", assignedTo: "Alice Green", remainingWork: 0, originalEstimate: 8, completedWork: 8 },
            { id: 103, type: "Task", title: "Build React components", state: "In Progress", assignedTo: "Alice Green", remainingWork: 6, originalEstimate: 12, completedWork: 6 }
          ]
        },
        {
          id: 104,
          type: "Product Backlog Item",
          title: "[Core] Implement Excel exporter utility",
          state: "Done",
          assignedTo: "Bob Miller",
          tags: "Sprint 13; Core",
          effort: 8,
          activatedDate: "2026-06-01T10:00:00Z",
          links: ["http://mock-wise/wise/98712"],
          children: [
            { id: 105, type: "Task", title: "Research xlsx-js-style properties", state: "Done", assignedTo: "Bob Miller", remainingWork: 0, originalEstimate: 4, completedWork: 4 },
            { id: 106, type: "Task", title: "Implement styling wrapper", state: "Done", assignedTo: "Bob Miller", remainingWork: 0, originalEstimate: 8, completedWork: 8 },
            { id: 107, type: "Task", title: "Unit test Excel output", state: "Done", assignedTo: "Bob Miller", remainingWork: 0, originalEstimate: 4, completedWork: 4 }
          ]
        },
        {
          id: 108,
          type: "Product Backlog Item",
          title: "[Bug] Report Dialog tabs overlap on small screens",
          state: "New",
          assignedTo: null,
          tags: "Sprint 13",
          effort: 2,
          children: []
        }
      ]
    }
  },
  multiteam: {
    name: "Multi-Team Setup",
    description: "Configured with multiple active teams to test combining data in the Multi-Team tab.",
    data: {
      "DE_BK_Green": [
        {
          id: 201,
          type: "Product Backlog Item",
          title: "[Green] Implement feature alpha",
          state: "Done",
          assignedTo: "Alice Green",
          tags: "Sprint 13",
          effort: 5,
          activatedDate: "2026-06-01T08:30:00Z",
          children: [{ id: 202, type: "Task", title: "Code frontend", state: "Done", assignedTo: "Alice Green", remainingWork: 0, originalEstimate: 8, completedWork: 8 }]
        }
      ],
      "DE_BK_Blue": [
        {
          id: 301,
          type: "Product Backlog Item",
          title: "[Blue] Integrate backend database schema",
          state: "Done",
          assignedTo: "Dave Blue",
          tags: "Sprint 13",
          effort: 8,
          activatedDate: "2026-06-01T09:00:00Z",
          children: [
            { id: 302, type: "Task", title: "Write migrations", state: "Done", assignedTo: "Dave Blue", remainingWork: 0, originalEstimate: 6, completedWork: 6 },
            { id: 303, type: "Task", title: "Update repository layers", state: "Done", assignedTo: "Dave Blue", remainingWork: 0, originalEstimate: 10, completedWork: 10 }
          ]
        },
        {
          id: 304,
          type: "Product Backlog Item",
          title: "[Blue] Implement schema cache layer",
          state: "In Progress",
          assignedTo: "Eva White",
          tags: "Sprint 13",
          effort: 3,
          activatedDate: "2026-06-04T11:00:00Z",
          children: [
            { id: 305, type: "Task", title: "Define interface", state: "Done", assignedTo: "Eva White", remainingWork: 0, originalEstimate: 4, completedWork: 4 },
            { id: 306, type: "Task", title: "Implement Redis driver", state: "In Progress", assignedTo: "Eva White", remainingWork: 8, originalEstimate: 8, completedWork: 2 }
          ]
        }
      ],
      "DE_EX_Yellow": [
        {
          id: 401,
          type: "Product Backlog Item",
          title: "[Yellow] Document APIs and tutorials",
          state: "In Progress",
          assignedTo: "Frank Yellow",
          tags: "Sprint 13",
          effort: 2,
          activatedDate: "2026-06-03T10:00:00Z",
          children: [{ id: 402, type: "Task", title: "Draft guides", state: "In Progress", assignedTo: "Frank Yellow", remainingWork: 4, originalEstimate: 6, completedWork: 2 }]
        }
      ]
    }
  },
  edgecases: {
    name: "Edge Cases & Color Codes",
    description: "Contains items pulled in late, items activated early, and custom suffixes (+, !) to test color highlights.",
    data: {
      "DE_BK_Green": [
        {
          id: 501,
          type: "Product Backlog Item",
          title: "[Late] Item pulled in late (activated > 2 days after start)",
          state: "In Progress",
          assignedTo: "Jack Green",
          tags: "Sprint 13",
          effort: 5,
          activatedDate: "2026-06-05T09:00:00Z", // Sprint starts 2026-06-01. This is 4 days after.
          children: [{ id: 502, type: "Task", title: "Initial work", state: "In Progress", assignedTo: "Jack Green", remainingWork: 8 }]
        },
        {
          id: 503,
          type: "Product Backlog Item",
          title: "[Plus] Item with Sprint 13+ suffix tag (sprint commit additions)",
          state: "Done",
          assignedTo: "Alice Green",
          tags: "Sprint 13+",
          effort: 3,
          activatedDate: "2026-06-01T09:00:00Z",
          children: []
        },
        {
          id: 504,
          type: "Product Backlog Item",
          title: "[Bang] Item with Sprint 13! critical bug/hotfix tag",
          state: "In Progress",
          assignedTo: "Bob Miller",
          tags: "Sprint 13!",
          effort: 1,
          activatedDate: "2026-06-01T09:00:00Z",
          children: []
        },
        {
          id: 505,
          type: "Product Backlog Item",
          title: "[Early] Item activated BEFORE the sprint start date",
          state: "In Progress",
          assignedTo: "Alice Green",
          tags: "Sprint 13",
          effort: 5,
          activatedDate: "2026-05-28T09:00:00Z", // Before June 1
          children: []
        },
        {
          id: 506,
          type: "Product Backlog Item",
          title: "[Minus] Item removed from sprint (Sprint 13-)",
          state: "Removed",
          assignedTo: "Bob Miller",
          tags: "Sprint 13-",
          effort: 3,
          activatedDate: "2026-06-01T09:00:00Z",
          children: []
        }
      ]
    }
  },
  empty: {
    name: "Empty Sprint",
    description: "A completely empty sprint with no work items recorded.",
    data: {
      "DE_BK_Green": []
    }
  }
};

class SandboxState {
  public currentScenario: string = "standard";
  public mockData: Record<string, MockWorkItem[]> = JSON.parse(JSON.stringify(SCENARIOS.standard.data));
  public isDarkMode: boolean = false;
  public apiLogs: { timestamp: string; method: string; url: string; status: number }[] = [];
  public currentUrlParams = {
    collection: "DefaultCollection",
    project: "WirelineRnD",
    team: "DE_BK_Green",
    sprint: "Sprint 13",
    iterationPath: "Sprint 13"
  };

  constructor() {
    this.loadState();
  }

  public loadState() {
    const saved = localStorage.getItem("sprint-report-generator-sandbox-state") || localStorage.getItem("ados-helper-sandbox-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentScenario = parsed.currentScenario || "standard";
        this.mockData = parsed.mockData || JSON.parse(JSON.stringify((SCENARIOS as Record<string, { name: string; description: string; data: Record<string, MockWorkItem[]> }>)[this.currentScenario]?.data || SCENARIOS.standard.data));
        this.isDarkMode = !!parsed.isDarkMode;
        this.currentUrlParams = parsed.currentUrlParams || this.currentUrlParams;
      } catch (e) {
        console.warn("Failed to load sandbox state", e);
      }
    }
  }

  public saveState() {
    localStorage.setItem(
      "sprint-report-generator-sandbox-state",
      JSON.stringify({
        currentScenario: this.currentScenario,
        mockData: this.mockData,
        isDarkMode: this.isDarkMode,
        currentUrlParams: this.currentUrlParams
      })
    );
  }

  public resetScenario(scenarioKey: string) {
    this.currentScenario = scenarioKey;
    const scenario = (SCENARIOS as Record<string, { name: string; description: string; data: Record<string, MockWorkItem[]> }>)[scenarioKey];
    if (scenario) {
      this.mockData = JSON.parse(JSON.stringify(scenario.data));
    } else {
      this.mockData = {};
    }
    this.saveState();
  }

  public addLog(method: string, url: string, status: number) {
    const timestamp = new Date().toLocaleTimeString();
    this.apiLogs.unshift({ timestamp, method, url, status });
    if (this.apiLogs.length > 50) this.apiLogs.pop();
    updateLogsUI();
  }
}

const state = new SandboxState();

// Fetch interception
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = input.toString();

  // Intercept Team Field Values API
  if (urlStr.includes("/_apis/work/teamsettings/teamfieldvalues")) {
    state.addLog("GET", urlStr, 200);

    const parts = urlStr.split("/_apis/work/teamsettings/teamfieldvalues");
    let project = state.currentUrlParams.project;
    let team = state.currentUrlParams.team;

    if (parts[0]) {
      const segments = parts[0].split("/");
      if (segments.length >= 3) {
        team = decodeURIComponent(segments.pop() || team);
        project = decodeURIComponent(segments.pop() || project);
      }
    }

    const areaPath = `${project}\\Engineering\\${team}`.replace("Pixel_Perfect", "PixelPerfect");
    const res = {
      defaultValue: areaPath,
      values: [
        {
          value: areaPath,
          includeChildren: true
        }
      ]
    };

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 1. Intercept Iterations API
  if (urlStr.includes("/_apis/work/teamsettings/iterations")) {
    state.addLog("GET", urlStr, 200);

    if (state.currentScenario === "error") {
      return new Response(JSON.stringify({ message: "Simulated Azure DevOps server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Parse team and project from URL if possible
    // URL pattern: {origin}/{collection}/{project}/{team}/_apis/work/teamsettings/iterations?api-version=6.0
    const parts = urlStr.split("/_apis/work/teamsettings/iterations");
    const sprintName = state.currentUrlParams.sprint;
    let project = state.currentUrlParams.project;
    let team = state.currentUrlParams.team;

    if (parts[0]) {
      const segments = parts[0].split("/");
      if (segments.length >= 3) {
        team = decodeURIComponent(segments.pop() || team);
        project = decodeURIComponent(segments.pop() || project);
      }
    }

    const sprintNameSafe = sprintName || "Sprint 13";
    const match = sprintNameSafe.match(/(Sprint|Iteration)(?:\s+|-|_|)(\d+)/i);
    const value = [];
    if (match) {
      const prefix = match[1] || "Sprint";
      const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
      const currentNum = parseInt(match[2] || "13", 10);
      for (let i = 7; i >= 0; i--) {
        const num = currentNum - i;
        if (num <= 0) continue;
        const name = `${formattedPrefix} ${num}`;
        const start = new Date(new Date("2026-06-01T00:00:00Z").getTime() - i * 14 * 24 * 60 * 60 * 1000);
        const finish = new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);
        value.push({
          name,
          path: `${project}\\${team}\\${name}`,
          attributes: {
            startDate: start.toISOString(),
            finishDate: finish.toISOString()
          }
        });
      }
    } else {
      value.push({
        name: sprintNameSafe,
        path: `${project}\\${team}\\${sprintNameSafe}`,
        attributes: {
          startDate: "2026-06-01T00:00:00Z",
          finishDate: "2026-06-14T23:59:59Z"
        }
      });
    }

    const res = { value };

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Intercept public WIQL API
  if (urlStr.includes("/_apis/wit/wiql")) {
    state.addLog("POST", urlStr, 200);

    if (state.currentScenario === "error") {
      return new Response(JSON.stringify({ message: "Simulated query error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // URL: .../{collection}/{project}/_apis/wit/wiql?api-version=...
    // The public WIQL API does not include a /team segment, so we use the configured team directly.

    let wiql = "";
    try {
      if (init?.body) {
        const bodyObj = JSON.parse(init.body.toString());
        wiql = bodyObj.query || "";
      }
    } catch (e) {
      console.warn("Failed to parse WIQL body in sandbox", e);
    }

    const itemsForTeam = state.mockData[state.currentUrlParams.team] || [];
    const isLinkQuery = wiql.includes("WorkItemLinks");

    if (isLinkQuery) {
      const relations: { source: { id: number }; target: { id: number } }[] = [];
      const seen = new Set<string>();

      function addRelations(item: MockWorkItem, parentId: number | null) {
        if (parentId !== null) {
          const key = `${parentId}-${item.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            relations.push({ source: { id: parentId }, target: { id: item.id } });
          }
        }
        if (item.children) {
          for (const child of item.children) {
            addRelations(child, item.id);
          }
        }
      }

      for (const item of itemsForTeam) {
        addRelations(item, null);
      }

      return new Response(JSON.stringify({ workItemRelations: relations }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const items: { id: number }[] = [];
      function collectItemIds(item: MockWorkItem) {
        items.push({ id: item.id });
        if (item.children) {
          for (const child of item.children) {
            collectItemIds(child);
          }
        }
      }
      for (const item of itemsForTeam) {
        collectItemIds(item);
      }

      return new Response(JSON.stringify({ workItems: items }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 4. Intercept WorkItems Batch API
  if (urlStr.includes("/_apis/wit/workitemsbatch")) {
    state.addLog("POST", urlStr, 200);

    if (state.currentScenario === "error") {
      return new Response(JSON.stringify({ message: "Simulated batch error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Try to get body to find IDs requested
    let ids: number[] = [];
    try {
      if (init?.body) {
        const bodyObj = JSON.parse(init.body.toString());
        ids = bodyObj.ids || [];
      }
    } catch (e) {
      console.warn("Failed to parse workitemsbatch request body", e);
    }

    // Collect all items currently in state to extract relations
    const allItems: MockWorkItem[] = [];
    function collect(items: MockWorkItem[]) {
      for (const item of items) {
        allItems.push(item);
        if (item.children) collect(item.children);
      }
    }
    for (const teamKey of Object.keys(state.mockData)) {
      collect(state.mockData[teamKey] || []);
    }

    const valuePayload = ids.map(id => {
      const match = allItems.find(item => item.id === id);
      const relations =
        match?.links?.map(link => ({
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: link
        })) || [];

      const iterationPath = `${state.currentUrlParams.project}\\${state.currentUrlParams.team}\\${state.currentUrlParams.sprint}`;

      return {
        id: id,
        relations: relations,
        fields: {
          "System.Id": match?.id ?? id,
          "System.Title": match?.title ?? "",
          "System.State": match?.state ?? "",
          "System.AssignedTo": match?.assignedTo ?? null,
          "System.IterationPath": iterationPath,
          "System.WorkItemType": match?.type ?? "",
          "System.TeamProject": state.currentUrlParams.project,
          "System.Tags": match?.tags ?? "",
          "Microsoft.VSTS.Scheduling.Effort": match?.effort ?? 0,
          "Microsoft.VSTS.Scheduling.RemainingWork": match?.remainingWork ?? null,
          "Microsoft.VSTS.Scheduling.OriginalEstimate": match?.originalEstimate ?? null,
          "Microsoft.VSTS.Scheduling.CompletedWork": match?.completedWork ?? null,
          "Microsoft.VSTS.Common.ActivatedDate": match?.activatedDate ?? null
        }
      };
    });

    return new Response(JSON.stringify({ value: valuePayload }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Intercept WorkItem Updates API
  if (urlStr.includes("/_apis/wit/workitems/") && urlStr.includes("/updates")) {
    state.addLog("GET", urlStr, 200);

    const match = urlStr.match(/_apis\/wit\/workitems\/(\d+)\/updates/i);
    const id = match?.[1] ? parseInt(match[1], 10) : 0;

    let value: unknown[] = [];
    if (id === 199) {
      value = [
        {
          id: 1,
          rev: 1,
          revisedDate: "2026-05-15T09:00:00Z",
          fields: {
            "System.IterationPath": {
              newValue: "WirelineRnD\\Sprint 13"
            }
          }
        },
        {
          id: 2,
          rev: 2,
          revisedDate: "2026-06-08T10:00:00Z",
          fields: {
            "System.IterationPath": {
              oldValue: "WirelineRnD\\Sprint 13",
              newValue: "WirelineRnD\\Backlog"
            }
          }
        }
      ];
    } else if (id === 501) {
      value = [
        {
          id: 1,
          rev: 1,
          revisedDate: "2026-05-10T09:00:00Z",
          fields: {
            "System.IterationPath": {
              newValue: "WirelineRnD\\Sprint 12"
            }
          }
        },
        {
          id: 2,
          rev: 2,
          revisedDate: "2026-06-05T09:00:00Z",
          fields: {
            "System.IterationPath": {
              oldValue: "WirelineRnD\\Sprint 12",
              newValue: "WirelineRnD\\Sprint 13"
            }
          }
        }
      ];
    } else if (id === 503) {
      value = [
        {
          id: 1,
          rev: 1,
          revisedDate: "2026-05-12T09:00:00Z",
          fields: {
            "System.IterationPath": {
              newValue: "WirelineRnD\\Sprint 12"
            }
          }
        },
        {
          id: 2,
          rev: 2,
          revisedDate: "2026-06-03T10:00:00Z",
          fields: {
            "System.IterationPath": {
              oldValue: "WirelineRnD\\Sprint 12",
              newValue: "WirelineRnD\\Sprint 13"
            }
          }
        }
      ];
    } else if (id === 506) {
      value = [
        {
          id: 1,
          rev: 1,
          revisedDate: "2026-05-14T09:00:00Z",
          fields: {
            "System.IterationPath": {
              newValue: "WirelineRnD\\Sprint 13"
            }
          }
        },
        {
          id: 2,
          rev: 2,
          revisedDate: "2026-06-07T14:30:00Z",
          fields: {
            "System.State": {
              oldValue: "Committed",
              newValue: "Removed"
            }
          }
        }
      ];
    } else {
      value = [
        {
          id: 1,
          rev: 1,
          revisedDate: "2026-06-01T09:00:00Z",
          fields: {
            "System.IterationPath": {
              newValue: "WirelineRnD\\Sprint 13"
            }
          }
        }
      ];
    }

    return new Response(JSON.stringify({ count: value.length, value }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Fallback to real fetch
  return originalFetch.apply(this, [input, init]);
};

// UI Rendering for the Sandbox
function syncUrl() {
  const { collection, project, team, iterationPath } = state.currentUrlParams;
  const simulatedPath = `/${collection}/${project}/_sprints/taskboard/${team}/dummy/${encodeURIComponent(iterationPath)}`;
  window.history.replaceState({}, "", simulatedPath);
  window.dispatchEvent(new Event("urlChange"));
}

function updateThemeClass() {
  const navMenu = document.querySelector(".project-navigation") as HTMLElement;
  if (navMenu) {
    if (state.isDarkMode) {
      navMenu.style.backgroundColor = "rgb(59, 58, 57)"; // Dark theme trigger
      document.body.classList.add("dark-mode-sandbox");
    } else {
      navMenu.style.backgroundColor = "rgb(255, 255, 255)"; // Light theme trigger
      document.body.classList.remove("dark-mode-sandbox");
    }
  }
}

function updateLogsUI() {
  const container = document.getElementById("sandbox-logs");
  if (!container) return;

  if (state.apiLogs.length === 0) {
    container.innerHTML = `<div style="color: #888; font-size: 0.85rem; padding: 4px;">No requests captured yet.</div>`;
    return;
  }

  container.innerHTML = state.apiLogs
    .map(
      log => `
      <div style="font-family: monospace; font-size: 0.75rem; margin-bottom: 6px; padding: 4px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
        <span style="color: #ffb86c;">[${log.timestamp}]</span>
        <span style="color: ${log.method === "POST" ? "#50fa7b" : "#8be9fd"}; font-weight: bold; margin: 0 4px;">${log.method}</span>
        <span style="color: #f8f8f2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; flex: 1; margin-right: 4px;" title="${log.url}">
          ${log.url.split("/_api").pop() || log.url.split("/_apis").pop() || log.url}
        </span>
        <span style="color: ${log.status === 200 ? "#50fa7b" : "#ff5555"}">${log.status}</span>
      </div>
    `
    )
    .join("");
}

function updateDataEditorUI() {
  const textarea = document.getElementById("sandbox-data-editor") as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = JSON.stringify(state.mockData, null, 2);
  }
}

// Initial setup on page load
window.addEventListener("DOMContentLoaded", () => {
  // 1. Create simulated page structure
  const body = document.body;
  body.style.margin = "0";
  body.style.fontFamily = "'Inter', sans-serif";
  body.style.backgroundColor = "#e1dfdd";
  body.style.display = "flex";
  body.style.height = "100vh";
  body.style.overflow = "hidden";

  // Create main container and sidebar
  const mainArea = document.createElement("div");
  mainArea.id = "sandbox-main-area";
  mainArea.style.flex = "1";
  mainArea.style.padding = "20px";
  mainArea.style.display = "flex";
  mainArea.style.flexDirection = "column";
  mainArea.style.position = "relative";
  mainArea.style.overflowY = "auto";

  // Dummy elements for script connection
  const projectNav = document.createElement("div");
  projectNav.className = "project-navigation";
  projectNav.style.display = "none";
  body.appendChild(projectNav);

  const mockHeader = document.createElement("div");
  mockHeader.style.backgroundColor = "#0078d4";
  mockHeader.style.color = "white";
  mockHeader.style.padding = "10px 20px";
  mockHeader.style.display = "flex";
  mockHeader.style.alignItems = "center";
  mockHeader.style.fontWeight = "600";
  mockHeader.style.fontSize = "1.1rem";
  mockHeader.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  mockHeader.innerHTML = `
    <span style="margin-right: 8px;">⛅</span> Azure DevOps Sandbox Simulator
  `;
  mainArea.appendChild(mockHeader);

  // Content card
  const mockContent = document.createElement("div");
  mockContent.style.backgroundColor = "white";
  mockContent.style.marginTop = "20px";
  mockContent.style.borderRadius = "4px";
  mockContent.style.padding = "20px";
  mockContent.style.boxShadow = "0 1px 3px rgba(0,0,0,0.13)";
  mockContent.style.flex = "1";
  mockContent.style.display = "flex";
  mockContent.style.flexDirection = "column";
  mockContent.style.justifyContent = "center";
  mockContent.style.alignItems = "center";
  mockContent.innerHTML = `
    <div style="font-size: 1.25rem; font-weight: 500; margin-bottom: 8px; color: #333;">Taskboard Mock View</div>
    <div style="font-size: 0.9rem; color: #666; margin-bottom: 24px; text-align: center; max-width: 450px;">
      The Sprint Report Generator app mounts a button right next to the search bar. Click "Reports" in the header below to open the dialog.
    </div>
    
    <div style="border: 1px solid #ccc; width: 100%; max-width: 700px; border-radius: 4px; padding: 12px; display: flex; align-items: center; justify-content: space-between; background-color: #f3f2f1;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600; color: #0078d4; font-size: 0.9rem;">Taskboard Sprints</span>
        <span style="color: #666; font-size: 0.9rem;">/</span>
        <span id="header-sprint-display" style="font-size: 0.9rem; font-weight: 500; color: #333;">Sprint 13</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="expandable-search-header" style="height: 32px; border: 1px dashed #0078d4; border-radius: 2px; display: flex; align-items: center; padding: 0 10px; color: #0078d4; font-size: 0.8rem; font-family: monospace; background-color: #edf2f7;">
          .expandable-search-header (App anchors here)
        </div>
      </div>
    </div>
  `;
  mainArea.appendChild(mockContent);

  // Sidebar controls
  const sidebar = document.createElement("div");
  sidebar.id = "sandbox-sidebar";
  sidebar.style.width = "380px";
  sidebar.style.backgroundColor = "#1e1e1e";
  sidebar.style.color = "#f8f8f2";
  sidebar.style.padding = "20px";
  sidebar.style.display = "flex";
  sidebar.style.flexDirection = "column";
  sidebar.style.boxShadow = "-2px 0 10px rgba(0,0,0,0.3)";
  sidebar.style.overflowY = "auto";
  sidebar.style.borderLeft = "1px solid #333";
  sidebar.style.transition = "width 0.3s ease, padding 0.3s ease, border-left 0.3s ease";

  // Sidebar header
  const sidebarTitle = document.createElement("h2");
  sidebarTitle.style.margin = "0 0 16px 0";
  sidebarTitle.style.fontSize = "1.25rem";
  sidebarTitle.style.fontWeight = "600";
  sidebarTitle.style.backgroundImage = "linear-gradient(90deg, #ff79c6, #8be9fd)";
  sidebarTitle.style.webkitBackgroundClip = "text";
  sidebarTitle.style.webkitTextFillColor = "transparent";
  sidebarTitle.innerText = "Developer Console";
  sidebar.appendChild(sidebarTitle);

  // Theme Toggle
  const themeGroup = document.createElement("div");
  themeGroup.style.marginBottom = "20px";
  themeGroup.style.display = "flex";
  themeGroup.style.justifyContent = "space-between";
  themeGroup.style.alignItems = "center";
  themeGroup.innerHTML = `
    <span style="font-size: 0.9rem; font-weight: 500;">Simulated Dark Mode</span>
    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
      <input type="checkbox" id="theme-toggle-chk" style="opacity: 0; width: 0; height: 0;">
      <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
    </label>
  `;
  sidebar.appendChild(themeGroup);

  // Form Fields section
  const configSection = document.createElement("div");
  configSection.style.marginBottom = "20px";
  configSection.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #ff79c6; border-bottom: 1px solid #333; padding-bottom: 4px;">Route Config</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
      <div>
        <label style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px;">Collection</label>
        <input id="in-collection" class="sb-input" value="${state.currentUrlParams.collection}" style="width: 100%; box-sizing: border-box; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
      </div>
      <div>
        <label style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px;">Project</label>
        <input id="in-project" class="sb-input" value="${state.currentUrlParams.project}" style="width: 100%; box-sizing: border-box; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
      <div>
        <label style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px;">Team</label>
        <input id="in-team" class="sb-input" value="${state.currentUrlParams.team}" style="width: 100%; box-sizing: border-box; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
      </div>
      <div>
        <label style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px;">Sprint</label>
        <input id="in-sprint" class="sb-input" value="${state.currentUrlParams.sprint}" style="width: 100%; box-sizing: border-box; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
      </div>
    </div>
    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px;">Iteration Path</label>
      <input id="in-iterpath" class="sb-input" value="${state.currentUrlParams.iterationPath}" style="width: 100%; box-sizing: border-box; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
    </div>
    <button id="btn-update-route" style="width: 100%; background: #0078d4; border: none; color: white; padding: 6px 12px; border-radius: 4px; font-weight: 500; font-size: 0.85rem; cursor: pointer;">
      Apply & Dispatch urlChange
    </button>
  `;
  sidebar.appendChild(configSection);

  // Add styles for toggle switch and inputs
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .switch input:checked + .slider { background-color: #ff79c6; }
    .switch .slider:before {
      position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
      background-color: white; transition: .4s; border-radius: 50%;
    }
    .switch input:checked + .slider:before { transform: translateX(22px); }
    .sb-input:focus { outline: none; border-color: #ff79c6 !important; }
    .dark-mode-sandbox { background-color: #121212 !important; }
    .dark-mode-sandbox #sandbox-main-area { background-color: #1b1b1b !important; }
    .dark-mode-sandbox #sandbox-main-area > div:nth-child(2) { background-color: #252526 !important; color: white !important; }
    .dark-mode-sandbox #sandbox-main-area > div:nth-child(2) div { color: #ccc !important; }
    .dark-mode-sandbox #sandbox-main-area > div:nth-child(2) #header-sprint-display { color: white !important; }
    .dark-mode-sandbox #sandbox-main-area > div:nth-child(2) > div:nth-child(3) { background-color: #333333 !important; border-color: #444 !important; }
  `;
  document.head.appendChild(styleEl);

  // Scenario picker
  const scenarioSection = document.createElement("div");
  scenarioSection.style.marginBottom = "20px";
  scenarioSection.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #ff79c6; border-bottom: 1px solid #333; padding-bottom: 4px;">Mock Scenario</h3>
    <select id="scenario-select" style="width: 100%; background: #2d2d2d; border: 1px solid #444; color: white; border-radius: 4px; padding: 6px 8px; font-size: 0.85rem; margin-bottom: 8px; outline: none;">
      ${Object.keys(SCENARIOS)
        .map(key => `<option value="${key}" ${state.currentScenario === key ? "selected" : ""}>${(SCENARIOS as Record<string, { name: string; description: string; data: Record<string, MockWorkItem[]> }>)[key]?.name || ""}</option>`)
        .join("")}
      <option value="error" ${state.currentScenario === "error" ? "selected" : ""}>Simulate API Server Error (500)</option>
    </select>
    <div id="scenario-desc" style="font-size: 0.75rem; color: #aaa; line-height: 1.3;">
      ${state.currentScenario === "error" ? "All requests will fail with a 500 status code." : (SCENARIOS as Record<string, { name: string; description: string; data: Record<string, MockWorkItem[]> }>)[state.currentScenario]?.description || ""}
    </div>
  `;
  sidebar.appendChild(scenarioSection);

  // Live Data Editor
  const dataSection = document.createElement("div");
  dataSection.style.marginBottom = "20px";
  dataSection.style.display = "flex";
  dataSection.style.flexDirection = "column";
  dataSection.style.flex = "1";
  dataSection.style.minHeight = "200px";
  dataSection.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #ff79c6; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
      <span>Live Mock Data JSON</span>
      <button id="btn-reset-data" style="background: none; border: none; color: #8be9fd; font-size: 0.75rem; cursor: pointer; padding: 0;">Reset</button>
    </h3>
    <textarea id="sandbox-data-editor" style="flex: 1; min-height: 150px; background: #151515; border: 1px solid #333; border-radius: 4px; color: #50fa7b; font-family: monospace; font-size: 0.75rem; padding: 8px; resize: vertical; box-sizing: border-box;"></textarea>
    <button id="btn-save-data" style="width: 100%; background: #28a745; border: none; color: white; padding: 6px 12px; border-radius: 4px; font-weight: 500; font-size: 0.85rem; cursor: pointer; margin-top: 8px;">
      Save & Apply Changes
    </button>
  `;
  sidebar.appendChild(dataSection);

  // HTTP Request Log
  const logSection = document.createElement("div");
  logSection.style.height = "150px";
  logSection.style.display = "flex";
  logSection.style.flexDirection = "column";
  logSection.innerHTML = `
    <h3 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #ff79c6; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: space-between;">
      <span>Intercepted Requests</span>
      <button id="btn-clear-logs" style="background: none; border: none; color: #aaa; font-size: 0.75rem; cursor: pointer; padding: 0;">Clear</button>
    </h3>
    <div id="sandbox-logs" style="flex: 1; background: #151515; border: 1px solid #333; border-radius: 4px; padding: 6px; overflow-y: auto; box-sizing: border-box;">
    </div>
  `;
  sidebar.appendChild(logSection);

  // Collapse/Expand toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "sandbox-sidebar-toggle";
  toggleBtn.innerHTML = "🛠️ Hide Console";
  toggleBtn.style.position = "absolute";
  toggleBtn.style.right = "20px";
  toggleBtn.style.top = "10px";
  toggleBtn.style.zIndex = "2000";
  toggleBtn.style.backgroundColor = "#1e1e1e";
  toggleBtn.style.border = "1px solid #444";
  toggleBtn.style.borderRadius = "4px";
  toggleBtn.style.color = "#8be9fd";
  toggleBtn.style.padding = "6px 12px";
  toggleBtn.style.fontSize = "0.85rem";
  toggleBtn.style.fontWeight = "500";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.display = "flex";
  toggleBtn.style.alignItems = "center";
  toggleBtn.style.gap = "6px";
  toggleBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  toggleBtn.style.transition = "all 0.2s ease";

  toggleBtn.addEventListener("mouseenter", () => {
    toggleBtn.style.borderColor = "#ff79c6";
    toggleBtn.style.transform = "scale(1.02)";
  });
  toggleBtn.addEventListener("mouseleave", () => {
    toggleBtn.style.borderColor = "#444";
    toggleBtn.style.transform = "scale(1)";
  });

  let isCollapsed = false;
  toggleBtn.addEventListener("click", () => {
    if (isCollapsed) {
      sidebar.style.width = "380px";
      sidebar.style.padding = "20px";
      sidebar.style.borderLeft = "1px solid #333";
      toggleBtn.innerHTML = "🛠️ Hide Console";
      toggleBtn.style.color = "#8be9fd";
      setTimeout(() => {
        sidebar.style.overflowY = "auto";
      }, 300);
    } else {
      sidebar.style.overflowY = "hidden";
      sidebar.style.width = "0px";
      sidebar.style.padding = "0px";
      sidebar.style.borderLeft = "none";
      toggleBtn.innerHTML = "🛠️ Show Console";
      toggleBtn.style.color = "#ff79c6";
    }
    isCollapsed = !isCollapsed;
  });

  mainArea.appendChild(toggleBtn);

  // Assemble container
  body.appendChild(mainArea);
  body.appendChild(sidebar);

  // Register UI Event Listeners
  const themeToggle = document.getElementById("theme-toggle-chk") as HTMLInputElement;
  themeToggle.checked = state.isDarkMode;
  themeToggle.addEventListener("change", e => {
    state.isDarkMode = (e.target as HTMLInputElement).checked;
    state.saveState();
    updateThemeClass();
  });

  const btnUpdateRoute = document.getElementById("btn-update-route");
  btnUpdateRoute?.addEventListener("click", () => {
    const coll = (document.getElementById("in-collection") as HTMLInputElement).value;
    const proj = (document.getElementById("in-project") as HTMLInputElement).value;
    const team = (document.getElementById("in-team") as HTMLInputElement).value;
    const spr = (document.getElementById("in-sprint") as HTMLInputElement).value;
    const iter = (document.getElementById("in-iterpath") as HTMLInputElement).value;

    state.currentUrlParams = { collection: coll, project: proj, team, sprint: spr, iterationPath: iter };
    state.saveState();

    const sprintDisplay = document.getElementById("header-sprint-display");
    if (sprintDisplay) sprintDisplay.innerText = spr;

    syncUrl();
  });

  const scenarioSelect = document.getElementById("scenario-select") as HTMLSelectElement;
  scenarioSelect.addEventListener("change", e => {
    const val = (e.target as HTMLSelectElement).value;
    state.resetScenario(val);

    const desc = document.getElementById("scenario-desc");
    if (desc) {
      desc.innerText = val === "error" ? "All requests will fail with a 500 status code." : (SCENARIOS as Record<string, { name: string; description: string; data: Record<string, MockWorkItem[]> }>)[val]?.description || "";
    }

    updateDataEditorUI();
    syncUrl(); // Re-trigger load
  });

  const btnSaveData = document.getElementById("btn-save-data");
  btnSaveData?.addEventListener("click", () => {
    const text = (document.getElementById("sandbox-data-editor") as HTMLTextAreaElement).value;
    try {
      const parsed = JSON.parse(text);
      state.mockData = parsed;
      state.saveState();
      alert("Mock data applied successfully! Refreshing view...");
      syncUrl(); // Re-trigger load in app
    } catch (err) {
      alert(`Invalid JSON format:\n${(err as Error).message}`);
    }
  });

  const btnResetData = document.getElementById("btn-reset-data");
  btnResetData?.addEventListener("click", () => {
    state.resetScenario(state.currentScenario);
    updateDataEditorUI();
    syncUrl();
  });

  const btnClearLogs = document.getElementById("btn-clear-logs");
  btnClearLogs?.addEventListener("click", () => {
    state.apiLogs = [];
    updateLogsUI();
  });

  // Initial UI sync
  updateThemeClass();
  updateLogsUI();
  updateDataEditorUI();
  syncUrl();
});
