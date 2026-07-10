import { config } from "./config";

export type UploadFile = { uri: string; name: string; type: string };

export function makeApi(getToken: () => Promise<string | undefined>) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${config.apiUrl}/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((init.headers as Record<string, string>) ?? {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }
  async function upload<T>(path: string, file: UploadFile): Promise<T> {
    const token = await getToken();
    const form = new FormData();
    // React Native's FormData accepts {uri, name, type} descriptors.
    form.append("file", file as unknown as Blob);
    const res = await fetch(`${config.apiUrl}/api${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }
  return {
    get: <T>(p: string) => request<T>(p),
    post: <T>(p: string, body: unknown) =>
      request<T>(p, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(p: string, body: unknown) =>
      request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
    del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
    upload,
  };
}

export type Api = ReturnType<typeof makeApi>;
