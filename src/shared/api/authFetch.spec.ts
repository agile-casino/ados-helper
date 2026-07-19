import { describe, expect, it, vi } from "vitest";
import { createAuthFetch } from "./authFetch";

describe("createAuthFetch", () => {
  it("injects Authorization header with Bearer token", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200 } as Response);
    const getToken = vi.fn().mockResolvedValue("my-token");
    const authFetch = createAuthFetch(getToken, fetchSpy);

    await authFetch("https://example.com/api", { method: "GET" });

    expect(getToken).toHaveBeenCalledOnce();
    const [_url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("preserves existing headers when adding Authorization", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200 } as Response);
    const authFetch = createAuthFetch(() => Promise.resolve("tok"), fetchSpy);

    await authFetch("https://example.com/api", { headers: { "X-Custom": "val" } });

    const [_url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok");
    expect(headers.get("X-Custom")).toBe("val");
  });

  it("retries with fresh token on 401", async () => {
    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      return { status: callCount === 1 ? 401 : 200 } as Response;
    });
    const getToken = vi.fn().mockResolvedValue("tok1");
    const authFetch = createAuthFetch(getToken, fetchSpy);

    const res = await authFetch("https://example.com/api");

    expect(res.status).toBe(200);
    expect(getToken).toHaveBeenCalledTimes(2);
    const [_url1, init1] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const [_url2, init2] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(new Headers(init1.headers).get("Authorization")).toBe("Bearer tok1");
    expect(new Headers(init2.headers).get("Authorization")).toBe("Bearer tok1");
  });

  it("returns 401 response directly on second 401", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 401 } as Response);
    const getToken = vi.fn().mockResolvedValue("tok");
    const authFetch = createAuthFetch(getToken, fetchSpy);

    const res = await authFetch("https://example.com/api");

    expect(res.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it("passes through non-401 responses as-is", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 404, statusText: "Not Found" } as Response);
    const authFetch = createAuthFetch(() => Promise.resolve("tok"), fetchSpy);

    const res = await authFetch("https://example.com/api");

    expect(res.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("throws when getAccessToken fails on initial call", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200 } as Response);
    const authFetch = createAuthFetch(() => Promise.reject(new Error("auth failed")), fetchSpy);

    await expect(authFetch("https://example.com/api")).rejects.toThrow("auth failed");
  });

  it("throws when getAccessToken fails on retry", async () => {
    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      return { status: callCount === 1 ? 401 : 200 } as Response;
    });
    const getToken = vi.fn().mockResolvedValueOnce("tok").mockRejectedValueOnce(new Error("retry auth failed"));
    const authFetch = createAuthFetch(getToken, fetchSpy);

    await expect(authFetch("https://example.com/api")).rejects.toThrow("retry auth failed");
  });

  it("works when input is a URL object", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200 } as Response);
    const authFetch = createAuthFetch(() => Promise.resolve("tok"), fetchSpy);

    await authFetch(new URL("https://example.com/api"));

    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
