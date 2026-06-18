# ADOS Helper

A Tampermonkey script that enhances Azure DevOps (ADOS) with additional productivity features.

## Features

- **Work Item Enhancements** – Adds extra functionality to work item pages
- **Board Enhancements** – Improves the Kanban/sprint board experience
- **Query Enhancements** – Extends the work item query interface
- **Pull Request Enhancements** – Adds helpers to PR pages
- **Settings Page** – Configure extension behaviour via a dedicated options page

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
```

### Development Sandbox (Recommended)

To test changes quickly without loading real data or reloading real ADOS pages, run the interactive local development sandbox:

```bash
pnpm dev
```

Then open [http://localhost:5173/](http://localhost:5173/) in your browser. The sandbox provides:

- **ADOS Shell Simulation:** Mounts the ADOS Helper app inside a simulated Azure DevOps interface.
- **REST API Interception:** Automatically redirects all Azure DevOps REST requests to mock data.
- **Scenario Control Panel:** Switch between standard sprint, multi-team config, edge cases (color coding for late items/special tags), empty sprints, or server error simulations.
- **Live Data Editor:** Edit the mock JSON directly in the browser sidebar and apply changes instantly.
- **Dark/Light Theme Toggle:** Instantly check UI styling in both dark and light modes.
- **Hot Module Replacement (HMR):** Updates to files in the `src/` folder reload in real-time.

### Production Build

To build the production userscript:

```bash
pnpm build
```

### Watch (auto-rebuild on change)

For testing the compiled script directly in the browser (e.g., via Tampermonkey/Violentmonkey file-system requirements):

```bash
pnpm build:watch
```

Built output is placed in the `dist/` folder.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
