# Sprint Report Generator — Azure DevOps Extension

Enhance your Azure Boards iteration backlog with custom reporting panels, sprint metrics, pull request summaries, and high-fidelity PDF/Excel exports.

---

## 🚀 Overview

The **Sprint Report Generator Extension** integrates directly into your organization's Azure DevOps portal. It contributes a dedicated **Reports** tab to the Sprint Backlog / Iteration view, placing critical charts, velocity metrics, and export controls right alongside native boards.

### 🌟 Key Features

- **Integrated Reports Tab:** View sprint velocity, cumulative flow, and scope changes directly inside Azure Boards.
- **High-Fidelity Exports:** Generate detailed PDF summaries and Excel workbooks of your sprint items, commitments, and status changes in one click.
- **Context-Aware Metrics:** Automatically reads active sprint board states and filters metrics by team and iteration dates.
- **Consistent Styling:** Designed with Mantine UI to match the Azure DevOps visual language, supporting both light and dark mode preferences.

---

## 🔒 Security & Privacy

We take data security seriously:

- **100% Client-Side:** The extension runs entirely inside your browser sandbox.
- **No External Services:** Work item descriptions, sprint scopes, and user data are never sent to external servers. All report generation (PDF and Excel) is computed locally in the browser.
- **Scoped Permissions:** The extension requests only the minimum required access scopes (`vso.work` for backlog data, and `vso.project` for team configuration).

---

## 📥 Installation for Administrators

Organization administrators can install this extension directly into their Azure DevOps organization:

1. Locate the **Sprint Report Generator** extension in the Visual Studio Marketplace.
2. Click **Get it free** and select your Azure DevOps organization.
3. Click **Install**.
4. Once installed, navigate to any project's **Boards ➔ Sprints** view. The new **Reports** tab will appear next to the _Taskboard_, _Backlog_, and _Capacity_ tabs.
