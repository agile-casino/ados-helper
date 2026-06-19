import { isTauri } from "./isTauri";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

function fallbackBrowserDownload(data: Uint8Array, filename: string, mimeType: string) {
  if (!isBrowser) return;
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

export async function saveFile(data: Uint8Array, filename: string, mimeType: string): Promise<void> {
  if (!isTauri && !isBrowser) {
    // Return early in Node.js / test environments
    return;
  }

  if (isTauri) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const byteArray = Array.from(data);
      await invoke("save_file", { filename, bytes: byteArray });
      return;
    } catch (err) {
      console.error("Failed to save file via Tauri IPC:", err);
      // Fallback to standard browser download
    }
  }

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
          fallbackBrowserDownload(data, filename, mimeType);
        }
      });
      return;
    } catch (err) {
      console.error("Failed to use GM_download:", err);
    }
  }

  // Local sandbox / fallback browser download
  fallbackBrowserDownload(data, filename, mimeType);
}
