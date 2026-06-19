# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
