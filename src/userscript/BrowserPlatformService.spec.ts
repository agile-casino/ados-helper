// @vitest-environment happy-dom

import type React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BrowserPlatformService } from "./BrowserPlatformService";

describe("BrowserPlatformService", () => {
  let originalWindowOpen: typeof window.open;
  let service: BrowserPlatformService;

  beforeEach(() => {
    originalWindowOpen = window.open;
    window.open = vi.fn();
    service = new BrowserPlatformService();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    vi.restoreAllMocks();
  });

  test("openExternalLink opens in new tab and calls preventDefault", async () => {
    const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent;

    await service.openExternalLink("https://example.com", mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });
});
