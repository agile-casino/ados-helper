export type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createAuthFetch(getAccessToken: () => Promise<string>, fetchImpl: typeof fetch = fetch): AuthFetch {
  return async (input, init = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetchImpl(input, { ...init, headers });

    if (response.status === 401) {
      const retryToken = await getAccessToken();
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${retryToken}`);
      return fetchImpl(input, { ...init, headers: retryHeaders });
    }

    return response;
  };
}
