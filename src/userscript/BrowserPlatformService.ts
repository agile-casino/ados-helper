import type React from "react";
import type { PlatformService } from "../shared/services/PlatformService";

export class BrowserPlatformService implements PlatformService {
  constructor() {
    this.saveFile = this.saveFile.bind(this);
    this.openExternalLink = this.openExternalLink.bind(this);
  }

  async saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void> {
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    if (!isBrowser) return;

    // Reports are generated in-memory, so use a page-context blob download.
    // GM_download cannot reliably read page-created blob: URLs and may fail
    // silently, which previously left the Word export doing nothing.
    this.browserDownload(data, filename, mimeType);
  }

  private browserDownload(data: Uint8Array, filename: string, mimeType: string) {
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
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
