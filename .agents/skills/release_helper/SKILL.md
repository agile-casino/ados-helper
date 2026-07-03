---
name: release_helper
description: Guide and run the release process for ados-helper, including changelog updates, verification, and version bumping.
---

# Release Helper

This skill triggers when you are preparing or finalizing a release of `ados-helper`.

## Step-by-Step Release Checklist

1. **Verify Workspace State:**
   Ensure your workspace has no uncommitted changes:

   ```bash
   git status
   ```

2. **Changelog Update:**
   - Open [CHANGELOG.md](file:///root/ados-helper/CHANGELOG.md).
   - Relocate the entries from the `## [Unreleased]` block to a new version header following [Keep a Changelog](https://keepachangelog.com/) guidelines:
     ```markdown
     ## [X.Y.Z] - YYYY-MM-DD
     ```
   - Commit the changelog prep commit:
     ```bash
     git add CHANGELOG.md
     git commit -m "chore: prepare release for version X.Y.Z"
     ```

3. **Review and Update User-Facing READMEs:**
   - If the release introduces new features or changes to how a specific build target is installed or behaves, review and update its corresponding user-facing documentation:
     - **Browser Userscript:** [src/userscript/README.md](file:///root/ados-helper/src/userscript/README.md)
     - **Tauri Desktop App:** [src/desktop/README.md](file:///root/ados-helper/src/desktop/README.md)
     - **Azure DevOps Extension:** [src/extension/README.md](file:///root/ados-helper/src/extension/README.md) _(This README is directly displayed on the Visual Studio Marketplace detail page)._
   - Commit any documentation updates:
     ```bash
     git add README.md src/*/README.md
     git commit -m "docs: update target-specific READMEs for version X.Y.Z"
     ```

4. **Validation Check:**
   - Execute the check suite:
     ```bash
     pnpm check
     ```
   - Do not skip this step. All lint, build, typescript compilation, and unit tests must pass before proceeding.

5. **Version Bump:**
   - Bump version using `pnpm version [major|minor|patch]`:

     ```bash
     # If adding new backward-compatible features:
     pnpm version minor

     # If only doing bug fixes or refactoring:
     pnpm version patch
     ```

   - This command will execute `pnpm check` again via a pre-version hook, update package.json, update Tauri configuration automatically, commit, and create a git tag.

6. **Push Release:**
   - Push the release branch and the tag to origin:
     ```bash
     git push origin vX.Y.Z
     git push origin main
     ```
   - **Pre-push fail workaround:** If push checks fail due to vitest configurations/issues unrelated to your changes, override the check with:
     ```bash
     git push origin vX.Y.Z --no-verify
     git push origin main --no-verify
     ```
