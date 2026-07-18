export type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createAuthFetch(getAccessToken: () => Promise<string>): AuthFetch {
  return async (input, init = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const request = new Request(input, { ...init, headers });
    const response = await fetch(request);

    if (response.status === 401) {
      const retryToken = await getAccessToken();
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${retryToken}`);
      const retryRequest = new Request(input, { ...init, headers: retryHeaders });
      return fetch(retryRequest);
    }

    return response;
  };
}
