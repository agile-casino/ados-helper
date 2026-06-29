---
name: sandbox_development
description: Guide testing and development in the ADOS simulation sandbox, including API mocking.
---

# Sandbox Development Guide

This skill triggers when you are developing, enhancing, or refactoring UI components or features that render inside the Azure DevOps (ADOS) interface.

## Sandbox Overview

Since live Azure DevOps APIs are not available during local development, the codebase features an interactive simulation sandbox under `src/dev/`.

- Vite server is started via: `pnpm dev`
- Local sandbox runs at: `http://localhost:5173/`
- All Azure DevOps REST API calls are intercepted and redirected to mock data.

## Guidelines

1. **Verify UI Changes:**
   - Always run `pnpm dev` when changing UI code.
   - Access the local sandbox and test features.
   - Use the **Scenario Control Panel** to switch between mock scenarios (e.g., standard sprint, multi-team config, edge cases).
   - Use the theme toggle to test styling under both Light and Dark mode options.

2. **API and Scenario Mocking:**
   - Intercepted routes and mock data reside in [src/dev/sandbox.ts](file:///root/ados-helper/src/dev/sandbox.ts).
   - If your feature introduces a new REST API endpoint or requires additional fields in ADOS payloads, you MUST update [sandbox.ts](file:///root/ados-helper/src/dev/sandbox.ts) to handle these requests.
   - Ensure mocks align with standard Azure DevOps API schemas.
