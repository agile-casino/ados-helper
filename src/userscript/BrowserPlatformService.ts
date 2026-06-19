import type React from "react";
import type { PlatformService } from "../shared/services/PlatformService";

export class BrowserPlatformService implements PlatformService {
  async saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void> {
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    if (!isBrowser) return;

    // Check if running in Tampermonkey with GM_download
    // @ts-expect-error GM_download is a global in Tampermonkey
    if (typeof GM_download !== "undefined") {
      try {
        const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        // @ts-expect-error GM_download is a global in Tampermonkey
        GM_download({
          url: blobUrl,
          name: filename,
          onload: () => {
            URL.revokeObjectURL(blobUrl);
          },
          onerror: (err: unknown) => {
            console.error("GM_download failed, falling back to standard download:", err);
            URL.revokeObjectURL(blobUrl);
            this.fallbackBrowserDownload(data, filename, mimeType);
          }
        });
        return;
      } catch (err) {
        console.error("Failed to use GM_download:", err);
      }
    }

    this.fallbackBrowserDownload(data, filename, mimeType);
  }

  private fallbackBrowserDownload(data: Uint8Array, filename: string, mimeType: string) {
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
