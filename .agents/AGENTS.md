# ADOS Helper Agent Guidelines

Welcome to the **ados-helper** codebase. This file provides guidelines and constraints for AI agents when developing, refactoring, and maintaining this project.

---

## 🛠️ Project Overview & Tech Stack

This project is a hybrid application that operates as:

1. A **Tampermonkey userscript** to inject productivity features directly into Azure DevOps (ADOS) pages.
2. A **Tauri desktop application** (`src-tauri/`) that wraps the extension logic in a native desktop container.

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
- `typed-css-modules` generates TypeScript type definitions for CSS modules (`.module.css.d.ts`). Run `pnpm tcm` to regenerate CSS module types if styling classes change.
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
