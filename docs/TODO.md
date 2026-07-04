# Refactoring TODO List

This document outlines the code quality, architectural, and performance improvements identified for the **ados-helper** project.

---

## 1. Malformed Query String in `QueryClient`

- **File:** [QueryClient.ts](file:///root/ados-helper/src/shared/api/query/QueryClient.ts#L16)
- **Problem:**
  The query parameters in `runQuery` contain two question marks `?` and are missing an equals sign `=` for the `api-version` parameter:
  ```typescript
  const url = encodeUrl(
    `${this.origin}/{0}/{1}/{2}/_api/_wit/query?__v=5?api-version5.1`,
    [collection, project, team],
  );
  ```
- **Consequences:**
  This results in a malformed query string (`?__v=5?api-version5.1`). To make tests pass, the mock assertion in [QueryClient.spec.ts](file:///root/ados-helper/src/shared/api/query/QueryClient.spec.ts#L27) was copy-pasted to assert this buggy behavior rather than correcting it.
- **Task:**
  - Correct the URL to use standard query string syntax: `?__v=5&api-version=5.1`.
  - Update the test assertions in `QueryClient.spec.ts` accordingly.

---

## 2. Non-Standard `Accept` Header Versioning in `WorkItemClient`

- **File:** [WorkItemClient.ts](file:///root/ados-helper/src/shared/api/workItems/WorkItemClient.ts#L20)
- **Problem:**
  The `Accept` header contains the API version instead of specifying it in the query string parameter:
  ```typescript
  "Accept": "application/json;api-version=5.1"
  ```
- **Consequences:**
  Azure DevOps REST API conventionally expects the `api-version` to be specified as a query parameter in the URL (e.g., `?api-version=5.1`), and Accept header versioning is fragile and prone to breaking.
- **Task:**
  - Move `api-version=5.1` from the request headers to the URL query string parameter in the `getRelations` endpoint.

---

## 3. High-Frequency `MutationObserver` on `document.body`

- **File:** [index.tsx](file:///root/ados-helper/src/userscript/index.tsx#L17)
- **Problem:**
  The userscript runs a `MutationObserver` on the entire `document.body` with all mutation settings enabled (`subtree`, `characterData`, `childList`):
  ```typescript
  const observer = new MutationObserver(() => {
    if (window.location.href !== url) { ... }
    if (!isInDocument(container)) {
      const searchHeader = document.querySelector(".expandable-search-header");
      ...
    }
  });
  ```
- **Consequences:**
  This observer triggers on every single repaint, hover, or minor text modification, leading to high CPU usage and potential performance stutter on complex pages.
- **Task:**
  - Restrict the observer to only run on relevant subtrees, or throttle/debounce the selector queries (`document.querySelector`).
  - Ideally, hook into the router/navigation changes of Azure DevOps if possible, instead of raw body observation.
