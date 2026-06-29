---
name: styling_and_verification
description: Assist with CSS modules typed-css-modules generation, code linting with Biome, Prettier, and Knip validation.
---

# Styling & Verification Assistant

This skill triggers when you are creating/modifying CSS files, checking linting, formatting code, or validating typescript types.

## CSS Modules Workflow

1. **Type Generation (`typed-css-modules`):**
   - This project uses CSS Modules (`.module.css`).
   - Every time styling classes are added, renamed, or deleted, type declarations (`.module.css.d.ts`) must be updated.
   - Run the type generator:
     ```bash
     pnpm tcm
     ```
   - Verify that typescript compilation succeeds after modifying CSS classes.

2. **Mantine UI:**
   - Use Mantine UI (v9) components for complex layouts, grids, and standard components. Combine them with CSS modules for component-specific overrides.

## Formatting & Code Style

1. **Biome:**
   - Run `pnpm lint` to check files, and `pnpm lint:fix` to auto-fix styling issues.
   - Indentation: 2 spaces.
   - String literals: Double quotes (`"string"`).
   - Line limit: 250 characters.
   - No trailing commas.
   - Arrow function parentheses: `asNeeded`.
2. **Prettier:**
   - Prettier is only configured for Markdown (`.md`) and YAML (`.yml`) files. Do not format JS/TS files with Prettier.

3. **Knip:**
   - Run `pnpm knip` to verify there are no unused files, exports, or dependencies.
   - Run `pnpm knip --fix` to clean them up.
