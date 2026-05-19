const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * Turn a server-relative upload path like `/uploads/menu/foo.jpg` into an
 * absolute URL pointing at the API origin. Already-absolute URLs are returned
 * unchanged. Null / undefined / empty string return null.
 */
export function absUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_URL}${u}`;
  return u;
}
