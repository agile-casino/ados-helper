// @vitest-environment happy-dom

import type React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ExtensionPlatformService } from "./ExtensionPlatformService";

describe("ExtensionPlatformService", () => {
  let service: ExtensionPlatformService;

  beforeEach(() => {
    service = new ExtensionPlatformService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("openExternalLink", () => {
    test("calls preventDefault on event", async () => {
      const mockService = { openNewWindow: vi.fn() };
      vi.spyOn(await import("azure-devops-extension-sdk"), "getService").mockResolvedValue(mockService);
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent;

      await service.openExternalLink("https://example.com", mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test("uses host navigation service when available", async () => {
      const mockService = { openNewWindow: vi.fn() };
      vi.spyOn(await import("azure-devops-extension-sdk"), "getService").mockResolvedValue(mockService);

      await service.openExternalLink("https://example.com");

      expect(mockService.openNewWindow).toHaveBeenCalledWith("https://example.com", "");
    });

    test("falls back to window.open when navigation service fails", async () => {
      vi.spyOn(await import("azure-devops-extension-sdk"), "getService").mockRejectedValue(new Error("Service unavailable"));
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      await service.openExternalLink("https://example.com");

      expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
    });

    test("falls back to window.open when navigation service returns null", async () => {
      vi.spyOn(await import("azure-devops-extension-sdk"), "getService").mockResolvedValue(null);
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      await service.openExternalLink("https://example.com");

      expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
    });
  });

  describe("saveFile", () => {
    test("creates a blob URL and triggers download", async () => {
      const createObjectURL = vi.fn(() => "blob:test");
      const revokeObjectURL = vi.fn();
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;

      const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => ({}) as unknown as Node);
      const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => ({}) as unknown as Node);

      const data = new Uint8Array([1, 2, 3]);
      await service.saveFile(data, "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      expect(createObjectURL).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
      expect(anchor.download).toBe("test.xlsx");
    });

    test("revokes the blob URL", async () => {
      vi.useFakeTimers();
      const revokeObjectURL = vi.fn();
      URL.revokeObjectURL = revokeObjectURL;
      URL.createObjectURL = vi.fn(() => "blob:test");

      vi.spyOn(document.body, "appendChild").mockImplementation(() => ({}) as unknown as Node);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => ({}) as unknown as Node);

      const data = new Uint8Array([1, 2, 3]);
      await service.saveFile(data, "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      vi.advanceTimersByTime(100);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");

      vi.useRealTimers();
    });
  });
});
