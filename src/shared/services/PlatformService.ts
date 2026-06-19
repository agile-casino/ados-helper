import type React from "react";

export interface PlatformService {
  saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void>;
  openExternalLink(url: string, e?: React.MouseEvent | React.KeyboardEvent): Promise<void>;
}
