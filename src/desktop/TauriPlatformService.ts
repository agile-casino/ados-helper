import { invoke } from "@tauri-apps/api/core";
import type React from "react";
import type { PlatformService } from "../shared/services/PlatformService";

export class TauriPlatformService implements PlatformService {
  constructor() {
    this.saveFile = this.saveFile.bind(this);
    this.openExternalLink = this.openExternalLink.bind(this);
  }

  async saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void> {
    try {
      const byteArray = Array.from(data);
      await invoke("save_file", { filename, bytes: byteArray });
    } catch (err) {
      console.error("Failed to save file via Tauri IPC:", err);
      // Fallback to standard browser download in case of failure
      this.fallbackBrowserDownload(data, filename, mimeType);
    }
  }

  private fallbackBrowserDownload(data: Uint8Array, filename: string, mimeType: string) {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  async openExternalLink(url: string, e?: React.MouseEvent | React.KeyboardEvent): Promise<void> {
    if (e) {
      e.preventDefault();
    }
    try {
      await invoke("open_url", { url });
    } catch (err) {
      console.error("Failed to open URL via Tauri command, falling back to window.open:", err);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}
