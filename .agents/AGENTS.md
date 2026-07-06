# ADOS Helper Agent Guidelines

Welcome to the **ados-helper** codebase. This file provides guidelines and constraints for AI agents when developing, refactoring, and maintaining this project.

---

## 🛠️ Project Overview & Tech Stack

This project is a hybrid application that operates as:

1. A **Tampermonkey userscript** to inject productivity features directly into Azure DevOps (ADOS) pages.
2. A **Tauri desktop application** (`src-tauri/`) that wraps the extension logic in a native desktop container.

### Codebase Architecture

- **[src/userscript/](file:///root/ados-helper/src/userscript)**: Entry point and environment-specific logic for the Tampermonkey userscript.
- **[src/desktop/](file:///root/ados-helper/src/desktop)**: Entry point and frontend logic for the Tauri desktop application.
- **[src/shared/](file:///root/ados-helper/src/shared)**: Core APIs, components, context, domain models, services, and utils shared between userscript and desktop modes.
- **[src/dev/](file:///root/ados-helper/src/dev)**: Local development sandbox simulating ADOS and intercepting REST APIs.

### Technologies

- **Core:** TypeScript, React (v19)
- **Styling:** CSS Modules (`typed-css-modules` / `.module.css`), Mantine UI (v9)
- **Build Tool:** Vite
- **Desktop Framework:** Tauri (v2)
- **Formatting & Linting:** Biome (rules defined in [biome.json](file:///root/ados-helper/biome.json))
- **Markdown & YAML Formatting:** Prettier
- **Testing:** Vitest, Happy DOM
- **Package Manager:** pnpm

---

## 📐 Coding & Style Rules

### 1. Code Formatting and Linting

- **Always use Biome** for linting and formatting TypeScript/JavaScript files. Run `pnpm lint` or `pnpm lint:fix`.
- Do not run Prettier on code files; Prettier is reserved for markdown (`.md`) and YAML (`.yml`) files.
- Biome formatting specifics:
  - 2-space indentation (spaces, not tabs).
  - Double quotes for JS/TS strings (`"string"`).
  - Line width limit: 250 characters.
  - No trailing commas.
  - Arrow function parentheses: `asNeeded`.

### 2. Styling Style Guide

- Prefer **CSS Modules** (e.g., `ComponentName.module.css`) for component styling.
- **CSS Type Generation:** `typed-css-modules` generates TypeScript type definitions for CSS modules (`.module.css.d.ts`). Run `pnpm tcm` to regenerate CSS module types whenever styling classes change. If styling classes are added or deleted, this script MUST be run to avoid TypeScript compilation errors.
- Use **Mantine UI** components where appropriate for UI layout, grids, and pre-built components.

### 3. Imports and File Names

- Keep file names consistent: React component files should be `.tsx` and use PascalCase (e.g., `MyComponent.tsx`), utility files should be `.ts` and camelCase (e.g., `dateUtils.ts`).
- Biome automatically organizes imports on save or during checks. Avoid manual layout adjustments unless necessary.

---

## 🧪 Testing & Verification

- Tests are powered by **Vitest** and run with a simulated browser environment via **Happy DOM**.
- To run tests once:
  ```bash
  pnpm test
  ```
- To run tests in watch mode:
  ```bash
  pnpm test:watch
  ```
- To run a full codebase verification (Types, Build, Tests, Lint):
  ```bash
  pnpm check
  ```

> [!NOTE]
> **Vitest Workspace Conflicts:**
> If you encounter the error: `Error: Projects "" and "" have different 'maxWorkers' but same 'sequence.groupOrder'`, this is a transient Vitest conflict that occurs when multiple configuration files are evaluated concurrently. Re-running the verification suite (`pnpm check` or `pnpm test`) usually resolves it.

---

## 🚀 Release Process

When preparing and performing a release, strictly follow the process outlined in [RELEASE.md](file:///root/ados-helper/RELEASE.md). Below is a summary checklist:

1. **Changelog Preparation:**
   - Move entries from the `[Unreleased]` block of [CHANGELOG.md](file:///root/ados-helper/CHANGELOG.md) to a new versioned header (e.g., `## [2.15.0] - YYYY-MM-DD`).
   - Format according to [Keep a Changelog](https://keepachangelog.com/).
   - Commit the changelog changes with `chore: prepare release for version X.Y.Z`.
2. **Build and Verification:**
   - Execute `pnpm check` to ensure code compiles, passes tests, and satisfies all lints.
3. **Bump Version:**
   - Run `pnpm version minor` (for backward-compatible features) or `pnpm version patch` (for bug fixes).
4. **Push Release:**
   - Push tags and branches to origin.
   - _Note:_ If tests fail during push checks due to vitest configuration issues unrelated to your change, push with `--no-verify`.

---

## 🖥️ Local Sandbox Development

For testing and verifying UI features:

1. Run the interactive dev server using `pnpm dev`.
2. Navigate to `http://localhost:5173/` to view the simulated ADOS Shell.
3. Intercepted ADOS REST APIs and mock responses are defined in [src/dev/sandbox.ts](file:///root/ados-helper/src/dev/sandbox.ts). Update this file to add mock handlers or custom UI states if needed.
4. Verify changes in both Light and Dark mode options.

---

## 🧠 Self-Improvement & Reflection Protocol

To ensure continuous improvement of the agentic setup, agents must follow this reflection protocol before completing any task:

1. **Reflect on Hurdles:** Did you encounter any configuration quirks, build/test issues, dependency resolutions, or lint challenges during this task?
2. **Document Findings:** If you resolved a unique issue (e.g., Vitest configuration glitches, Knip errors, package conflicts), update the "Troubleshooting" sections or add guidelines in this file (`AGENTS.md`) or in the relevant skill files.
3. **Collective Memory:** Keeping instructions fresh ensures subsequent agent runs do not hit the same friction points.
