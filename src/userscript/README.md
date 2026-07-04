# Sprint Report Generator — Browser Userscript

Inject productivity enhancements, report tools, and visual improvements directly into Azure DevOps (ADOS) using a browser userscript manager.

---

## 🚀 Overview

The **Userscript** target runs Sprint Report Generator directly on top of your existing Azure DevOps web pages. Once installed in your browser's userscript manager, it matches specific ADOS Board and Work Item URLs to inject rich metrics, PDF/Excel export controls, and inline styling improvements.

### 🌟 Key Features

- **Inline Enhancements:** Adds productivity helpers to work item forms, query tables, and pull request pages.
- **Sprint Reports Panel:** Adds action buttons directly on your ADOS Sprint Taskboard to generate PDF and Excel sprint reports on the fly.
- **Zero Infrastructure:** Runs entirely in your browser using the authenticated session already active in your browser.

---

## 🛠️ Prerequisites

To run the userscript, you need a modern web browser equipped with a userscript manager extension:

- [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
- [Violentmonkey](https://violentmonkey.github.io/)
- [Greasemonkey](https://www.greasemonkey.net/)

---

## 📥 Installation

1. Open your userscript manager dashboard (e.g., Tampermonkey).
2. Click **Create a new script** (or `+` icon).
3. Copy the entire contents of the release bundle file (`dist/sprint-report-generator.user.js` in this repository or from the releases tab).
4. Paste the code into the script editor, replacing any default template, and press **Save** (Ctrl+S / Cmd+S).
5. Navigate to your organization's Azure DevOps portal; the helper will automatically load on matching URLs.

---

## 🔒 Security & Privacy

Data remains strictly local to your browser session. The userscript does not transmit work item details, user info, or metrics to any external servers. All report exports are generated on the client side.
