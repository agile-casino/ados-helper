# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.18.9] - 2026-07-06

### Changed

- Refactored Mantine style imports to use a shared `mantine.css` in Tauri desktop build.

### Fixed

- Documented Vitest workspace troubleshooting/memory limit guidelines.

### Fixed

- Fixed layered styling issues in the browser userscript and Azure DevOps extension by importing layered Mantine styles.

## [2.18.7] - 2026-07-05

### Fixed

- Fixed host origin resolution in the Azure DevOps extension to prevent duplicated organization name in API requests, correcting the 'Dates Not Set' issue in the sprint stats tab.

## [2.18.6] - 2026-07-05

### Fixed

- Fixed color theme detection in the Azure DevOps extension to match the Azure DevOps host theme instead of the user's OS/browser settings.

## [2.18.5] - 2026-07-05

### Added

- Added "Say-Do Impact" column and status badges ("Excluded", "Reduces Ratio") to Sprint Stats tab tables.
- Added detailed tooltips for Sprint Churn, Planned Points, Completed Points, and Net Change Details on the Sprint Stats tab.
- Added Eruda Mobile DevTools integration in local sandbox `index.html`.

### Changed

- Renamed "Committed Points" to "Planned Points" across Sprint Stats metrics and cards to improve clarity.

## [2.18.4] - 2026-07-05

### Added

- Support "Iteration" prefix (in addition to "Sprint") for ADOS sprint names case-insensitively, with space, hyphen, underscore, or no separator.

## [2.18.3] - 2026-07-05

### Changed

- Renamed userscript and development userscript to "ADOS Helper".

## [2.18.2] - 2026-07-05

### Fixed

- Corrected userscript metadata download/update URLs and repository URLs to point to the `agile-casino` organization instead of `archerax`.

## [2.18.1] - 2026-07-05

### Added

- Temporarily output a copy of the userscript as `index.user.js` in the release assets.

## [2.18.0] - 2026-07-04

### Added

- Added comprehensive unit test suites for `encodeUrl`, `QueryClient`, `WorkItemClient`, `WorkItem`, `WorkItemCollection`, `PdfGenerator`, and `ReportGenerator`.
- Added a refactoring `TODO.md` document outlining code consolidation opportunities and next steps.
- Added a new high-quality `icon.png` icon asset.

### Changed

- Renamed package and local storage key prefix to `sprint-report-generator`.
- Renamed userscript output file to `sprint-report-generator.user.js` and updated userscript metadata (download/update URLs).
- Restructured and expanded target-specific documentation (`README.md` files) for userscript, desktop, and extension targets.
- Refactored `formatName` utility to improve name formatting robustness.
- Updated extension publisher identity and metadata in extension manifest files.
- Improved the release checklist and procedure documentation.

### Removed

- Removed deprecated GitHub Gist deployment workflows and visualstudio.com match patterns.

## [2.17.0] - 2026-07-03

### Added

- Added Sprint Stats tab showing detailed sprint statistics, including team capacity, work item distribution, and sprint burn down/velocity metrics.
- Added support in `ApiClient` for retrieving iteration capacities, team members, and work items.

## [2.16.3] - 2026-07-02

### Fixed

- Corrected userscript metadata closing tag to `// ==/UserScript==` so Tampermonkey can successfully parse and install the script.

## [2.16.2] - 2026-07-02

### Fixed

- Build the Tampermonkey userscript as an IIFE to ensure scoped execution and prevent global namespace contamination.

## [2.16.1] - 2026-07-01

### Fixed

- Added missing `categories` field to extension manifests (`vss-extension.json` and `vss-extension-dev.json`) to fix `tfx-cli` packaging failure.

## [2.16.0] - 2026-07-01

### Added

- Scaffolded and implemented native ADOS extension iframe integration.
- Introduced standalone `pnpm typecheck` script to separate TypeScript compilation from bundling.
- Added Husky and a pre-push git hook.
- Added design/integration plans for Zod, Git hooks, and Merge Mentor.

### Changed

- Optimized the `pnpm check` validation suite to decouple checking from build/bundling.
- Removed redundant `vite-plugin-checker` to avoid duplicate lints and speed up builds.
- Removed `vite-bundle-analyzer` from devDependencies to resolve segmentation faults during local chunk rendering.
- Aligned validation and lint scripts, and resolved formatting issues.
- Updated dependencies (Rust crates `reqwest` to 0.13, `log` to v0.4.33, `tauri-build` to v2.6.3, `tauri` to v2.11.3, and package upgrades).

## [2.15.4] - 2026-06-29

### Fixed

- Bound methods in `TauriPlatformService` and `BrowserPlatformService` constructors to allow calling them unbound safely.

## [2.15.3] - 2026-06-23

### Added

- Added `useAdoState` React hook for managing Azure DevOps state.

### Changed

- Updated development dependencies (`@tauri-apps/cli`, `@types/node`, and `knip`) and formatted `tauri.conf.json`.

## [2.15.2] - 2026-06-22

### Fixed

- Fixed the GitHub Release workflow to correctly locate, rename, and package the compiled executable (`app.exe`) to the product name (`ados-helper.exe`) before uploading it to release assets.

## [2.15.1] - 2026-06-22

### Added

- Added portable/bare `.exe` detection (`is_portable` command in Rust backend).
- Configured GitHub release workflow to package and upload the bare unbundled `ados-helper.exe` binary.

### Changed

- Configured NSIS installer to run fully silently by default and auto-launch the application on first-time double-click.
- Configured Tauri auto-updater to run in `passive` mode for background updates of the installed app.
- Updated the desktop auto-updater UI to redirect portable users to the GitHub Releases page on update, while preserving background auto-updates for installed users.

## [2.15.0] - 2026-06-21

### Added

- Added platform-specific capability abstraction with `PlatformService` (using Adapter/DI pattern), supporting distinct browser (`BrowserPlatformService`) and Tauri desktop (`TauriPlatformService`) implementations.
- Added developer guidelines and constraints in `.agents/AGENTS.md`.

### Changed

- Reorganized project directory layout into distinct folders: `src/shared/` (platform-agnostic), `src/userscript/` (userscript-specific), and `src/desktop/` (desktop/Tauri).
- Restored original TS checking and `css-injected-by-js` build plugins.
- Moved local development sandbox and page code to its own `src/dev/` directory.

### Removed

- Removed custom `<If>` React component and replaced usages in `WorkItemTable.tsx` with standard React conditional rendering.

### Fixed

- Disabled Tauri updater signing during validation builds in GitHub Actions workflows to speed up CI checking.

## [2.14.4] - 2026-06-19

### Changed

- Renamed the userscript file uploaded to GitHub Releases to `ados-helper.user.js` while keeping the original file names for Azure and Gist deploys.

## [2.14.3] - 2026-06-19

### Changed

- Configured Tauri bundle targets to build only the NSIS (`.exe`) installer, removing the MSI installer package.

## [2.14.2] - 2026-06-19

### Fixed

- Fixed the automated release GitHub workflow by correcting the `tauri-apps/tauri-action` version reference.

## [2.14.1] - 2026-06-19

### Changed

- Updated the Tauri updater public key verification configuration.

## [2.14.0] - 2026-06-19

### Added

- Added `save_file` command to Tauri backend for saving files.
- Implemented file saving in PDF and Excel report generation.
- Implemented `open_url` command to open URLs in the default browser.
- Added auto-update functionality in `renderer.tsx` with a notification for available updates.
- Added updater and process plugins to Tauri configuration.
- Added utility functions for sanitizing text for PDF generation and opening external links.

### Changed

- Enhanced error handling in API calls to provide clearer feedback on failures.
- Improved cookie management during login to prevent premature window closure.
- Refactored `WorkItemTable` to use `openExternalLink` for opening work item URLs.
- Updated PDF generation logic to sanitize descriptions and flag PBIs based on activation dates.
- Relocated review report, added auto-update plan, and licensed project under MIT.
- Restricted standard Renovate updates to weekends, prioritizing vulnerability updates.

## [2.13.0] - 2026-06-16

### Added

- Enhanced report generation with PDF and Excel export options in `CurrentTeamTab` and `MultiTeamTab`.
- Implemented PDF report generation in `PdfGenerator` with support for multi-team reports.
- Implemented an interactive local development sandbox.

### Changed

- Updated `ApiClient` to filter out tasks with parent work items in the work item queries.
- Enhanced `WorkItemTable` to conditionally display the WISE column based on work item data.
- Updated Vite configuration to disable code splitting for the user script output.

### Fixed

- Resolved testing pool configuration issues.

## [2.12.1] - 2026-06-14

### Changed

- Unified release workflows and updated documentation.
- Upgraded project dependencies, including upgrading pnpm to 11.6.0.
- Updated various GitHub Actions dependencies.

## [2.12.0] - 2026-06-11

### Added

- Original estimate and completed work calculations to WorkItem class, and updated related interfaces and reports.

### Fixed

- Resolved broken tests, package upgrades, and linting issues.

## [2.11.0] - 2026-04-21

### Added

- Enhanced sprint handling and reporting workflows.

### Changed

- Expanded support for additional PBI statuses.

### Fixed

- Improved team movement logic.
- Tightened Azure date parsing validation.
