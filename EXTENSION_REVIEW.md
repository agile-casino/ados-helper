# Azure DevOps Extension — Best Practices Review

**Date:** 2026-07-17
**Scope:** Azure DevOps extension target only (`vss-extension*.json`, `src/extension/`, `vite.extension.config.mts`, plus the shared API/component layer it consumes and CI/CD packaging)
**Reference baseline:** Microsoft `azure-devops-extension-sdk` v5 (installed package verified), official `microsoft/azure-devops-extension-sample`, and Azure DevOps extension publishing guidelines

**Overall verdict: 7 / 10** — The extension follows the recommended architecture in most structural areas (manifest, SDK handshake, dev/prod manifests, theming, host navigation service). The main gaps are in **authentication handling** (global `fetch` override with an indiscriminately injected Bearer token), use of an **undocumented internal REST endpoint**, and **stale context when the user switches sprints**.

---

## 1. Executive Summary

| #   | Severity  | Finding                                                                                                                                                                                  |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 🔴 High   | Global `window.fetch` monkey-patch injects the ADO Bearer token into **every** request, regardless of destination origin                                                                 |
| 2   | 🔴 High   | Work-item queries go to the undocumented internal portal endpoint `/_api/_wit/query` with a malformed query string (`?__v=5?api-version5.1`) instead of the public `/_apis/wit/wiql` API |
| 3   | 🟠 Medium | Access token is fetched once at mount and cached for the iframe's lifetime; delegated tokens are short-lived                                                                             |
| 4   | 🟠 Medium | Tab reads the sprint from `SDK.getConfiguration()` once at mount — switching sprints in the backlog view shows stale data                                                                |
| 5   | 🟠 Medium | CI workflow never builds the extension (`build:extension` only runs in the release workflow)                                                                                             |
| 6   | 🟡 Low    | `SDK.notifyLoadSucceeded()` is called without `init({ loaded: false })`, and `notifyLoadFailed()` is never used                                                                          |
| 7   | 🟡 Low    | ~1.8 MB main JS bundle; jspdf/xlsx are statically imported instead of loaded on demand                                                                                                   |
| 8   | 🟡 Low    | No tests for extension-specific code (`ExtensionApp`, `ExtensionPlatformService`, theme detection)                                                                                       |
| 9   | 🟡 Low    | Full query payloads (work item titles, assignees) are written to `console.log` in production                                                                                             |
| 10  | 🟡 Low    | Inconsistent/mixed REST API versions (5.1, 6.0, and the malformed `api-version5.1`)                                                                                                      |

---

## 2. What Already Follows Best Practice ✅

These areas are solid and should be kept as-is:

- **Manifest hygiene** (`vss-extension.json`): valid `manifestVersion: 1`, stable contribution ID, correct target (`ms.vss-work-web.iteration-backlog-tabs`), 128×128 PNG icon (marketplace minimum), branding, tags, support/repository links, and `addressable: true` on the `dist-extension` asset folder.
- **Separate dev manifest** (`vss-extension-dev.json`) with a distinct extension ID and `baseUri: http://localhost:5173` — exactly the Microsoft-recommended local development/hot-reload workflow.
- **Least-privilege scopes** (`vso.work`, `vso.project`) — no write scopes requested, and the privacy posture ("100% client-side, no external services") is documented in the marketplace README and honored by the code.
- **SDK handshake order**: `SDK.init()` → `SDK.ready()` → render → `SDK.notifyLoadSucceeded()` matches the official sample.
- **Theming**: the SDK's `applyTheme` option (default `true`) injects the host's theme CSS variables into the iframe and dispatches a `themeApplied` window event (verified in `SDK.js`). The `themeApplied` listener + CSS-variable detection in `ExtensionApp.tsx` is a correct implementation of light/dark support.
- **External navigation** (`ExtensionPlatformService.openExternalLink`): uses the host navigation service with a `noopener,noreferrer` `window.open` fallback — the recommended pattern.
- **Platform abstraction**: the shared `PlatformService` interface cleanly isolates extension/browser/Tauri differences. Good architecture.
- **Relative asset base** (`base: "./"` in `vite.extension.config.mts`) — required because extension assets are served from the publisher CDN (`*.gallery.vsassets.io`).
- **Version sync automation**: `scripts/update-versions.js` keeps `package.json`, both vss manifests, and `tauri.conf.json` in lockstep via the npm `version` hook.
- **Release packaging**: the release workflow builds the extension and packages the VSIX with `tfx-cli`; `dist-extension/` is correctly gitignored (built artifact, not source).
- **On-prem URL handling**: the `document.referrer` parsing that reconstructs the collection base URL for path-based TFS deployments (e.g. `/tfs/Collection`) is a thoughtful, pragmatic touch.

---

## 3. Detailed Findings

### 3.1 🔴 Global `fetch` override injects the Bearer token into all requests

**Location:** `src/extension/ExtensionApp.tsx:109-127`

```ts
const token = await SDK.getAccessToken();
const originalFetch = window.fetch;
window.fetch = (input, init) => {
  ...
  headersObj["Authorization"] = `Bearer ${token}`;
  return originalFetch(input, { ...init, headers: headersObj });
};
```

**Why it matters:**

1. **Token leakage risk.** The override attaches the user's delegated ADO token to _every_ request issued anywhere in the frame — including any future cross-origin request (third-party CDN, an `<img>` rendered by a report library, analytics, or a dependency fetching a remote resource). Today all app-issued requests target ADO origins so the risk is latent, but the guardrail is missing: there is no origin allowlist check.
2. **Hidden ambient coupling.** The shared `ApiClient` / `QueryClient` / `WorkItemClient` carry no auth concept at all — they silently depend on someone having mutated a global beforehand. This is invisible in their type signatures, breaks under test, and makes the auth contract impossible to reason about.
3. **No cleanup.** The original `fetch` is never restored (minor for a single-mount app, but it makes the module unsafe to reuse/test).

**Recommendation:**

- Stop mutating `window.fetch`. Give the API layer an explicit auth strategy, e.g. pass a `getAuthHeader(): Promise<HeadersInit>` callback into `ApiClient`, with the extension implementation calling `SDK.getAccessToken()`.
- If a fetch wrapper is kept, only add the header when `new URL(input, location.href).origin` matches the ADO host origin.
- Best-in-class option: use the official typed REST clients from `azure-devops-extension-api` (`getClient(WorkItemTrackingRestClient)`, `getClient(WorkRestClient)`), which handle auth, API versions, and URL construction for you.

---

### 3.2 🔴 Queries use an undocumented internal endpoint with a malformed URL

**Location:** `src/shared/api/query/QueryClient.ts:16`

```ts
const url = encodeUrl(`${this.origin}/{0}/{1}/{2}/_api/_wit/query?__v=5?api-version5.1`, ...);
```

**Why it matters:**

- `/_api/_wit/query?__v=5` is the **internal web-portal endpoint** the Azure DevOps UI itself uses — it is not part of the public REST API surface. Internal endpoints can change shape, auth requirements, or be removed without notice. This is the single most fragile dependency in the extension.
- The query string is malformed: `?__v=5?api-version5.1` has two `?` and `api-version5.1` is missing `=`. It works only because the server ignores the garbage — an accident waiting to break.
- The response contract (`payload.rows` / `payload.columns` / `sourceIds`) is likewise an internal, undocumented shape.

**Recommendation:** Migrate to the documented WIQL endpoint:

```
POST {origin}/{collection}/{project}/{team}/_apis/wit/wiql?api-version=7.1
{ "query": "SELECT ... FROM WorkItemLinks ..." }
```

and adapt the DTO mapping to the documented `workItems` / `workItemRelations` response shape (see `QueryResponseDto.ts`).

---

### 3.3 🟠 Access token is fetched once and cached for the session

**Location:** `src/extension/ExtensionApp.tsx:105`

The token is captured a single time during mount and baked into the fetch override. Delegated extension tokens are short-lived by design; the host issues a fresh one on each `getAccessToken()` call. In a long-lived sprint tab (users routinely leave sprint boards open for days), API calls will eventually start failing with 401s that the app neither expects nor handles.

**Recommendation:** Acquire the token lazily per request (or per request batch) via `SDK.getAccessToken()` — it's a cheap postMessage to the host — or use the `azure-devops-extension-api` clients, which handle token acquisition and refresh automatically. A 401 → refresh → retry once fallback is the minimum viable mitigation.

---

### 3.4 🟠 Sprint switching leaves the tab showing stale data

**Location:** `src/extension/ExtensionApp.tsx:160-175`

The iteration is read once from `SDK.getConfiguration()` at mount. When a user switches to a different sprint in the iteration backlog view, the tab's iframe is reused and the extension keeps rendering the previous sprint's data. The host communicates iteration changes to tab contributions through the configuration object (historically an `onIterationChanged` registration callback for this contribution point).

**Recommendation:** Verify the shape of `SDK.getConfiguration()` at runtime and subscribe to the host's iteration-change notification so `context.sprint` / `iterationPath` update and the tabs refetch. At minimum, log the configuration keys during development to confirm the available contract, and add an explicit "refresh" affordance as a fallback. (The child tabs already refetch when the props change — only the wiring is missing.)

---

### 3.5 🟠 CI never builds the extension

**Location:** `.github/workflows/ci.yml:26-31`

CI runs `typecheck`, `build` (the **userscript** target), `test`, and `biome` — but not `pnpm build:extension`. A broken extension build (e.g. a bad import in `src/extension/`, a manifest/build mismatch) is only caught by `release.yml`, i.e. **at release time**, the worst possible moment.

**Recommendation:** Add `pnpm run build:extension` to the CI workflow. Optionally also validate the manifest by running `tfx-cli extension create` in CI (packaging is a cheap smoke test that catches missing files/icons referenced by the manifest).

---

### 3.6 🟡 SDK load-notification semantics are incomplete

**Location:** `src/extension/index.tsx:6`, `src/extension/ExtensionApp.tsx:189-195`

Two small lifecycle issues:

1. `SDK.notifyLoadSucceeded()` is called, but `SDK.init()` is invoked without `{ loaded: false }`. Per the SDK typings (`SDK.d.ts:10-13`), `loaded` defaults to `true`, meaning the host hides its loading indicator as soon as the handshake completes — so `notifyLoadSucceeded()` is effectively a no-op and users see the extension's own "Loading…" text instead of the host spinner. Either call `SDK.init({ loaded: false })` (recommended — host spinner stays until the app is truly ready) or drop the redundant call.
2. On failure, the code only does `console.error` + renders a red div. The SDK provides `SDK.notifyLoadFailed(e)` (`SDK.d.ts:203`), which surfaces the failure properly in the host UI and telemetry. Use it in both `catch` paths (`index.tsx:16-18` and `ExtensionApp.tsx:192-195`).

---

### 3.7 🟡 Bundle size: ~1.8 MB initial JS

**Evidence:** `dist-extension/assets/extension-*.js` = **1,788,753 bytes** (plus 224 KB CSS).

The main chunk statically includes the entire reporting toolchain (`jspdf`, `jspdf-autotable`, `xlsx-js-style`) because `CurrentTeamTab.tsx:7-8` imports `generateReport` / `generatePdfReport` at module level — even though exports are only produced when the user clicks a button. (The build already demonstrates code-splitting works: `html2canvas` and `purify` are separate lazy chunks.)

**Recommendation:** Convert the export buttons to dynamic imports (`onClick={async () => { const { generatePdfReport } = await import("..."); ... }}`). This should cut initial load well under 1 MB. Consider `rollupOptions.output.manualChunks` for Mantine/React vendor splitting if further tuning is needed. Also note `lodash/set` pulls in lodash for one call — a small object-path helper would remove a dependency.

---

### 3.8 🟡 No tests for extension-specific code

The userscript target has `BrowserPlatformService.spec.ts`, but nothing covers:

- `ExtensionPlatformService` (navigation-service fallback logic, `saveFile` blob handling),
- the theme-detection helpers in `ExtensionApp.tsx` (`isColorDark`, `detectTheme` — pure functions, trivially testable),
- the origin/collection resolution logic from `document.referrer` (regex-heavy, on-prem-sensitive — the highest-value test candidate in the file).

**Recommendation:** Extract the pure helpers (`isColorDark`, `detectTheme`, referrer→origin resolution) into a testable module and add specs. Mock `azure-devops-extension-sdk` with `vi.mock` for `ExtensionPlatformService` tests.

---

### 3.9 🟡 Debug logging of full query payloads in production

**Location:** `src/shared/api/query/QueryClient.ts:36`

```ts
console.log("Query Response DTO:", responseDto);
```

Every WIQL response — work item titles, assignees, states — is written to the browser console of every user. For a marketplace-distributed extension this is a data-hygiene problem (and the README promises a strong privacy posture). **Recommendation:** remove it or gate it behind a dev-mode flag (`import.meta.env.DEV`).

---

### 3.10 🟡 Inconsistent and outdated REST API versions

- `teamsettings/iterations`, `teamfieldvalues`, `workitems/{id}/updates` → `api-version=6.0` (`ApiClient.ts:29,44,66,297`)
- `workitemsbatch` → version pinned in an `Accept` header as 5.1 (`WorkItemClient.ts:20`)
- query endpoint → broken `api-version5.1` (3.2)

**Recommendation:** Standardize on a single recent GA version (`7.1` as of today) passed consistently as a query parameter. Header-based and query-string versioning mixed across clients makes behavior hard to audit.

---

## 4. Minor Observations (nits)

- **`vss-extension.json:42-45`** — the marketplace details README is listed in `files` with `addressable: true`. Content files don't need to be addressable (that flag is for files fetched by URL at runtime); harmless but noisy.
- **`vss-extension.json`** — consider adding `content.screenshots` for the marketplace listing and a `links.license` entry (the repo has an MIT `LICENSE`).
- **`ExtensionApp.tsx:218`** — `height: "100vh"` on the root container assumes the iframe fills the host region; combined with the nested `overflow` rules this can double-scroll in some hosts. Prefer `height: 100%` chains, and keep `SDK.resize()` (`SDK.d.ts:302`) in mind if auto-sizing is ever needed.
- **`ExtensionApp.tsx:131`** — `hostContext.name || "DefaultCollection"` works for both hosted (org name) and on-prem (collection name), but the silent fallback could mask context-resolution failures; prefer failing visibly.
- **`ExtensionPlatformService.ts:20-22`** — `URL.revokeObjectURL` on a 100 ms timer can race slow download starts; revoke after the anchor click completes or with a more generous delay.
- **API version of `Accept` header** — `application/json;api-version=5.1` is a documented format, so it's valid, but see 3.10 on consistency.
- **Raw URL interpolation** — `ApiClient.ts` interpolates `collection`/`project`/`team` into URLs without encoding while `QueryClient`/`WorkItemClient` use `encodeUrl()`. Standardize on `encodeUrl()` (names with spaces or `#` will break the former).
- **WIQL injection surface** — team/project/iteration names are interpolated into WIQL string literals (`ApiClient.ts:87-115`). ADO restricts quotes in names, but defensive escaping of `'` in WIQL literals is cheap insurance.
- **Hard-coded customer logic in shared code** — `getTeamAreaPath` falls back to a path containing `.replace("Pixel_Perfect", "PixelPerfect")` (`ApiClient.ts`). For a distributable marketplace extension this belongs in configuration, not source. (Also flagged in `REVIEW_RECOMMENDATIONS.md`.)
- **Marketplace publishing is manual** — `release.yml` builds the VSIX and attaches it to the GitHub release but never runs `tfx extension publish`. If intentional, document the manual step in `RELEASE.md`; otherwise automate it with a marketplace PAT stored as a repo secret.
- **UI framework** — Microsoft recommends `azure-devops-ui` components for native look-and-feel. Mantine is a defensible choice, but the README's claim of matching "the Azure DevOps visual language" overstates it slightly, and Mantine contributes materially to the bundle in 3.7.

---

## 5. Prioritized Remediation Plan

| Priority | Effort | Action                                                                                       |
| -------- | ------ | -------------------------------------------------------------------------------------------- |
| P0       | M      | Replace the internal `/_api/_wit/query` endpoint with the public `/_apis/wit/wiql` API (3.2) |
| P0       | M      | Remove the global `fetch` override; inject auth per-request with an origin allowlist (3.1)   |
| P1       | S      | Acquire the access token lazily; handle 401 with a token refresh + retry (3.3)               |
| P1       | S      | Add `pnpm build:extension` (and ideally a VSIX packaging smoke test) to CI (3.5)             |
| P1       | M      | Subscribe to host iteration-change notifications so sprint switches refresh the tab (3.4)    |
| P2       | XS     | `SDK.init({ loaded: false })` + call `notifyLoadFailed()` on errors (3.6)                    |
| P2       | S      | Dynamic-import jspdf/xlsx behind the export buttons (3.7)                                    |
| P2       | XS     | Remove/gate the `console.log` of query payloads (3.9)                                        |
| P2       | S      | Standardize on `api-version=7.1` across all clients (3.10)                                   |
| P3       | M      | Add tests for `ExtensionPlatformService`, theme detection, and referrer-origin parsing (3.8) |

_(Effort: XS < 1h, S < half day, M < 2 days)_

---

## 6. References

- [Azure DevOps extension SDK (`azure-devops-extension-sdk`) — installed v5 typings & source](node_modules/azure-devops-extension-sdk/SDK.d.ts)
- [Microsoft official extension samples — `iteration-backlog-tabs`](https://github.com/microsoft/azure-devops-extension-sample/tree/master/src/Samples/iteration-backlog-tabs)
- [Extension manifest reference](https://learn.microsoft.com/en-us/azure/devops/extend/develop/manifest)
- [WIQL query REST API (`_apis/wit/wiql`)](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/wiql/query-by-wiql)
- [Extension targets reference](https://learn.microsoft.com/en-us/azure/devops/extend/reference/targets/overview)
