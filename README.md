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
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch (auto-rebuild on change)

```bash
npm run watch
```

Built output is placed in the `dist/` folder, which is what Chrome loads.

## License

UNLICENSED
