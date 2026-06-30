# Git Hooks Implementation Plan: ados-helper

This document outlines the steps to set up Git hooks in **ados-helper** using Husky to enforce code quality, compilation checks, and linting before pushing code.

---

## 1. Objectives

To prevent broken builds, formatting discrepancies, or regression bugs from being committed to the remote repository, we will configure a **pre-push hook** that executes the codebase checks.

---

## 2. Configuration Setup

We will configure Husky to run the existing `pnpm check` script before pushes. In [package.json](file:///root/ados-helper/package.json#L10), `pnpm check` is defined as:

```json
"check": "pnpm build && pnpm test && pnpm lint"
```

This ensures three validation gates:

1. **Compilation Check:** The application builds successfully (`pnpm build`).
2. **Unit Tests:** All Vitest unit tests pass (`pnpm test`).
3. **Format & Static Linting:** Code formatting passes Prettier and static analysis check via Biome & Knip (`pnpm lint`).

---

## 3. Step-by-Step Implementation Guide

### Step 3.1: Install Husky Dependency

Add `husky` as a devDependency in [package.json](file:///root/ados-helper/package.json):

```bash
pnpm add -D husky
```

### Step 3.2: Enable Git Hooks Automations

To ensure hooks are set up automatically when packages are installed, add a `prepare` script under the `scripts` section in [package.json](file:///root/ados-helper/package.json#L6-L21):

```json
"scripts": {
  ...
  "prepare": "husky"
}
```

Then, initialize Husky for the current project:

```bash
pnpm prepare
```

### Step 3.3: Create Pre-Push Hook Script

Create the configuration file at `.husky/pre-push` with the following content:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm check
```

Ensure the file is executable:

```bash
chmod +x .husky/pre-push
```

---

## 4. Verification

1. **Local Test Run:** Run `pnpm check` manually in the root folder to confirm compile, tests, and formatting pass.
2. **Push Interception:** Attempt to push a commit to a branch. The hook should execute the checking pipeline and block the push if any compilation, test, or lint error exists.
