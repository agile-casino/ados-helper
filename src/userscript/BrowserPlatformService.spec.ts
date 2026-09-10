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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("openExternalLink opens in new tab and calls preventDefault", async () => {
    const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent;

    await service.openExternalLink("https://example.com", mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });

  test("saveFile downloads via a blob anchor when called unbound", async () => {
    vi.useFakeTimers();
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => {
      return {} as unknown as Node;
    });
    const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => {
      return {} as unknown as Node;
    });

    const data = new Uint8Array([1, 2, 3]);
    const saveFile = service.saveFile;
    await saveFile(data, "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });
});
