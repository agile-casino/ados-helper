# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
