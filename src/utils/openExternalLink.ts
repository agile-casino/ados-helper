import { isTauri } from "./isTauri";

export async function openExternalLink(url: string, e?: React.MouseEvent | React.KeyboardEvent) {
  if (e) {
    e.preventDefault();
  }
  if (isTauri) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_url", { url });
    } catch (err) {
      console.error("Failed to open URL via Tauri command, falling back to window.open:", err);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
