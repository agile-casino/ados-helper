# Sprint Report Generator

Sprint Report Generator is a multi-target productivity tool designed to enhance the Azure DevOps (ADOS) sprint boards, work item forms, and reporting capabilities. It provides visual indicators, sprint metrics, pull request helpers, and high-fidelity PDF/Excel metrics reports.

The repository uses a **hybrid codebase architecture** where core components, business logic, client APIs, and styles are shared, but built and packaged into three distinct target formats:

- 🌐 **[Browser Userscript](file:///root/ados-helper/src/userscript/README.md)** — Inject productivity metrics directly into existing ADOS pages in any browser using a userscript manager (like Tampermonkey).
- 🖥️ **[Tauri Desktop Application](file:///root/ados-helper/src/desktop/README.md)** — Run Sprint Report Generator in a dedicated, isolated native desktop app container powered by Rust and Tauri.
- 🧩 **[Azure DevOps Extension](file:///root/ados-helper/src/extension/README.md)** — Embed Sprint Report Generator as an official Azure DevOps extension, adding a dedicated "Reports" tab to the Sprint Backlog views.

---

## 📂 Repository Layout

```
.
├── src/
│   ├── shared/         # Core logic, React components, CSS modules, APIs, and models
│   ├── userscript/     # Entry points and setup for the Tampermonkey target
│   ├── desktop/        # Frontend renderer for the Tauri desktop target
│   ├── extension/      # Entry points and contributions for the ADOS extension
│   └── dev/            # Local developer sandbox shell and REST mock interception
├── src-tauri/          # Tauri Rust main process and native desktop capabilities config
├── vss-extension.json  # Production manifest for the Azure DevOps Extension
├── vss-extension-dev.json # Local dev manifest for the Azure DevOps Extension
└── package.json        # Main build and developer scripts
```

---

## 🛠️ Getting Started & Local Sandbox

To check changes quickly without deploying to real ADOS environments, run the interactive local development sandbox:

```bash
pnpm install
pnpm dev
```

Open **[http://localhost:5173/](http://localhost:5173/)** to access the **ADOS Shell Simulation**, which includes:

- **Mock REST APIs:** Automatically intercepts and responds to ADOS REST calls (defined in `src/dev/sandbox.ts`).
- **Interactive Control Panel:** Toggle light/dark modes, inject sprint errors, and configure teams/backlog items on-the-fly.
- **Hot Module Replacement (HMR):** Updates to shared, userscript, desktop, or extension code are immediately reflected.

---

## ⚙️ Building & Packaging the Targets

### 1. Browser Userscript

- **Build production script:**
  ```bash
  pnpm build
  ```
  This compiles the bundle into `dist/sprint-report-generator.user.js`.
- **Active watch mode:**
  ```bash
  pnpm build:watch
  ```
- _For details on syncing local file URLs to your browser's userscript manager, see the [Userscript Developer Note](file:///root/ados-helper/src/userscript/README.md#local-development)._

### 2. Tauri Desktop App

Make sure you have Rust and system dependencies installed (see [Desktop Guide](file:///root/ados-helper/src/desktop/README.md#tauri-prerequisites)).

- **Run dev application:**
  ```bash
  pnpm tauri:dev
  ```
- **Compile native installers:**
  ```bash
  pnpm tauri:build
  ```
  Generates installer binaries (Debian, MSI, DMG, etc.) in `src-tauri/target/release/bundle/`.

### 3. Azure DevOps Extension

- **Compile static files:**
  ```bash
  pnpm build:extension
  ```
  This outputs compiled web assets to `dist-extension/`.
- **Package for local/dev hot reloading:**
  ```bash
  npx tfx-cli extension create --manifest-globs vss-extension-dev.json
  ```
- **Package for production release:**
  ```bash
  npx tfx-cli extension create --manifest-globs vss-extension.json
  ```

---

## 🧪 Testing & Verification

We enforce linting, formatting, and unit testing via pnpm commands:

- **Run unit tests** (powered by Vitest & Happy DOM):
  ```bash
  pnpm test
  ```
- **Run code formatting and lint checks** (powered by Biome and Prettier):
  ```bash
  pnpm lint
  ```
- **Run full codebase verification** (runs TypeScript compilation, lint, build, test):
  ```bash
  pnpm check
  ```
