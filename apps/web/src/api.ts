const baseUrl = import.meta.env.VITE_API_URL as string;

export function makeApi(getToken: () => Promise<string | undefined>) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${baseUrl}/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }
  async function upload<T>(path: string, file: File): Promise<T> {
    const token = await getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${baseUrl}/api${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }
  return {
    get: <T>(p: string) => request<T>(p),
    post: <T>(p: string, body: unknown) => request<T>(p, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(p: string, body: unknown) => request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
    del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
    upload,
  };
}

export type Api = ReturnType<typeof makeApi>;
