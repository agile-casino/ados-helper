# Tauri Implementation Review & Enhancements

We have reviewed the Tauri integration for the **ADOS Helper** project and implemented several enhancements to improve security, reliability, and standards conformance.

Below is a detailed report of the changes made, security implications, architectural analysis, and future recommendations.

---

## 🛠️ Changes Implemented

### 1. 🔒 Hardened WebView Capabilities (Security Fix)

- **Finding**: The Tauri capability configuration (`src-tauri/capabilities/default.json`) target was set to `*` (wildcard) for all windows.
- **Risk**: The application dynamically opens an external webview for authentication (`https://dev.azure.com/...`). If the capability targets `*`, this external window gets access to the Tauri IPC bridge and can execute any exposed commands. If Azure DevOps gets compromised, or the window is hijacked via DNS spoofing or XSS, an attacker could invoke backend commands like `fetch_from_ado` or `clear_session`.
- **Fix**:
  - Added an explicit `"label": "main"` to the primary desktop window in `tauri.conf.json`.
  - Restricted permissions in [default.json](src-tauri/capabilities/default.json) to only allow the `"main"` window:
    ```json
    "windows": ["main"]
    ```
  - This ensures that the `"login"` window (which loads remote Azure DevOps pages) has zero access to Tauri IPC commands.

### 2. 🛡️ Implemented Content Security Policy (CSP)

- **Finding**: In [tauri.conf.json](tauri.conf.json), the security configuration had `"csp": null`, which disables CSP protection.
- **Risk**: If there is an XSS vulnerability in any rendered content, a malicious script could execute unimpeded in the context of the main app window.
- **Fix**: Added a strict Content Security Policy to prevent unauthorized code execution, while allowing the necessary Google Fonts and Azure DevOps API integrations:
  ```json
  "security": {
    "csp": "default-src 'self'; connect-src 'self' https://dev.azure.com https://vssps.dev.azure.com; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
  }
  ```

### 3. 🔄 Robust Redirect Handling in Rust

- **Finding**: The reqwest client was configured with `.redirect(reqwest::redirect::Policy::none())`.
- **Issue**: While this is necessary to capture redirects to Microsoft login pages, it also blocks legitimate internal Azure DevOps API redirects. The frontend was forced to handle all 3xx redirects as errors or get broken payloads.
- **Fix**: Refactored [lib.rs](src-tauri/src/lib.rs) to use a custom redirect policy:
  ```rust
  .redirect(reqwest::redirect::Policy::custom(|attempt| {
      if attempt.previous().len() > 10 {
          attempt.error("Too many redirects")
      } else {
          let url_str = attempt.url().as_str();
          if url_str.contains("login.microsoftonline.com")
              || url_str.contains("live.com")
              || url_str.contains("/signin")
          {
              attempt.stop() // Intercept and return the login portal redirect
          } else {
              attempt.follow() // Follow safe internal redirects automatically
          }
      }
  }))
  ```
  This automatically follows internal redirects while stopping on login redirects to signal session expiration.

### 4. 🔠 API Call Casing and Header Robustness

- **Fix**: Made the HTTP method parsing case-insensitive by converting the method string to uppercase (`method.to_uppercase()`) before parsing. This prevents errors if the frontend sends lowercased HTTP methods.
- **Fix**: Made the `Accept` header detection case-insensitive in Rust. It now correctly looks for any variation of `"accept"` before injecting the default `"application/json"`.

### 5. 🧹 Resolved Clippy Warnings

- Collapsed nested `if` statements in the auth validation check to keep the Rust codebase lint-clean.

---

## 🏛️ Architectural & Best Practices Review

We conducted an architectural analysis of the project's multi-target setup, which compiles to a Tampermonkey userscript (`index.user.js`), a local developer sandbox UI, and a Tauri desktop application.

### Strengths & Best Practices Followed

1. **📦 Reusable Core (Dry Principle)**:
   - **95%+ Code Sharing**: The core UI components (`CurrentTeamTab`, `MultiTeamTab`) and domain reporting logic are entirely shared. Platforms (Userscript vs. Tauri) act as lightweight outer adapters that mount the shared components.
2. **🧩 API Abstraction**:
   - Integrating platform specific hooks via a bridge interface (`window.electronAPI`) allows the React application layer to remain platform-agnostic.
3. **🧪 Isolated Development Sandbox**:
   - Intercepting network requests globally in [sandbox.ts](src-dev/sandbox.ts) to serve dummy data scenarios is an outstanding development practice. It eliminates dependencies on active session cookies, rate-limiting, and CORS bugs during local development.
4. **⚡ Modernized Stack**:
   - Utilizing Biome for linting/formatting and Vitest for unit tests results in lightweight dependencies and extremely fast build times.

---

## 📈 Recommendations for Future Work

### 1. Scaffolding Tauri Releases in CI/CD (Highly Recommended)

Currently, your `.github/workflows/release.yml` only packages the web userscript (`index.user.js`). You should update it to compile and distribute the desktop application executables (`.exe`/`.msi` for Windows, `.dmg` for macOS, `.deb` for Linux).

We recommend adding a build job using the official `tauri-apps/tauri-action`:

```yaml
release-tauri:
  name: Build & Release Tauri App
  runs-on: ${{ matrix.platform }}
  strategy:
    fail-fast: false
    matrix:
      platform: [windows-latest, macos-latest, ubuntu-latest]
  steps:
    - name: Checkout Code
      uses: actions/checkout@v6

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: lts/*

    - name: Install System Dependencies (Linux only)
      if: matrix.platform == 'ubuntu-latest'
      run: |
        sudo apt-get update
        sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

    - name: Install Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Install Packages
      run: |
        npm i -g corepack@latest
        corepack enable
        pnpm install

    - name: Build Tauri Desktop App
      uses: tauri-apps/tauri-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tagName: v__VERSION__ # The action will automatically use the version from package.json
        releaseName: "Release v__VERSION__"
        releaseBody: "Automated desktop release of ADOS Helper"
        releaseDraft: true
        prerelease: false
```

### 2. Rename the Legacy Electron API Interface

- **Current state**: The desktop app uses `window.electronAPI` inside [renderer.tsx](src/desktop/renderer.tsx) to connect to Tauri's IPC commands.
- **Recommendation**: Since the application has been migrated to Tauri, keeping Electron terminology is confusing. Refactor the interface to a platform-agnostic name such as `window.desktopAPI` or `window.appAPI`.

### 3. Native File Dialogs for Report Saving

- **Current state**: Excel/PDF generation uses standard web/browser-based methods (`doc.save()` and `writeFile()`). While this works, it bypasses Tauri's native shell integration and may fail or default to obscure paths in locked-down environments.
- **Recommendation**: If running in Tauri, use the `@tauri-apps/plugin-dialog` to show a native file explorer Save Dialog, then write the bytes directly using `@tauri-apps/plugin-fs`.

### 4. Decouple API Interceptors from Global Scope

- **Current state**: To bypass CORS, Tauri intercepts standard requests by overwriting `window.fetch` globally in [renderer.tsx](src/desktop/renderer.tsx).
- **Recommendation**: Modifying browser prototypes globally can lead to unexpected side effects. Instead, create a dedicated HTTP client utility class that checks the platform (Tauri vs. Browser) and invokes either `fetch` or Tauri IPC commands.

### 5. Consolidate LocalStorage into Custom Hooks

- **Current state**: `localStorage` reads and writes are spread across component render methods.
- **Recommendation**: Consolidate local storage reads, writes, and synchronizations using React custom hooks (e.g. Mantine's built-in `useLocalStorage` hook) to ensure clean reactivity and compliance with modern React styles.

### 6. Binary Payload Support in `fetch_from_ado`

- **Current state**: `fetch_from_ado` reads response bodies as text: `response.text().await?`.
- **Recommendation**: If your app ever needs to fetch binary files (like attachments, images, or document exports) from Azure DevOps APIs, you should change `body` to a Base64-encoded string or byte array to prevent data corruption.
