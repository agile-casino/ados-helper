# ADOS Helper — Tauri Desktop App

A native desktop container wrapper for ADOS Helper, providing a dedicated, distraction-free environment for managing your Azure DevOps metrics and boards.

---

## 🚀 Overview

The **Desktop App** wraps the ADOS Helper interface in a native lightweight desktop container. By separating Azure DevOps activities from your browser tabs, it offers a fast, isolated environment with native OS integration.

### 🌟 Key Features

- **Isolated Workspace:** Separate cookies, cache, and state from standard browser windows to prevent accidental logouts and distractions.
- **Lightweight Footprint:** Utilizes the OS's native Webview (Webkit/WebView2) instead of bundling a heavy Chromium shell (like Electron), resulting in tiny binary sizes (~15-20MB) and very low memory consumption.
- **Desktop Integrations:** Native window management, operating system shortcuts, and background update notifications.

---

## 📥 Installation

Download the native installer matching your operating system from the repository's releases page and run the setup:

- **Windows:** Execute the `.msi` (Microsoft Installer) or portable executable.
- **macOS:** Open the `.dmg` (Disk Image) and drag the application to your `Applications` folder.
- **Linux:** Install the `.deb` package (Debian/Ubuntu) or run the standalone `.AppImage` archive.
