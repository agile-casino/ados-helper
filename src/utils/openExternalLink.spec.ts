// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as isTauriModule from "./isTauri";
import { openExternalLink } from "./openExternalLink";

describe("openExternalLink", () => {
  let originalWindowOpen: typeof window.open;

  beforeEach(() => {
    originalWindowOpen = window.open;
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    vi.restoreAllMocks();
  });

  test("opens in new tab when not in Tauri", async () => {
    vi.spyOn(isTauriModule, "isTauri", "get").mockReturnValue(false);
    const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent;

    await openExternalLink("https://example.com", mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });
});
