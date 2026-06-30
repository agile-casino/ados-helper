import * as SDK from "azure-devops-extension-sdk";
import type React from "react";
import type { PlatformService } from "../shared/services/PlatformService";

export class ExtensionPlatformService implements PlatformService {
  constructor() {
    this.saveFile = this.saveFile.bind(this);
    this.openExternalLink = this.openExternalLink.bind(this);
  }

  async saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void> {
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
      // Use the host's navigation service to open a new tab/window safely
      const navigationService = await SDK.getService<{ openNewWindow(url: string, features: string): void }>("ms.vss-web.navigation-service");
      if (navigationService) {
        navigationService.openNewWindow(url, "");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("Failed to use ADOS navigation service, falling back:", err);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}
