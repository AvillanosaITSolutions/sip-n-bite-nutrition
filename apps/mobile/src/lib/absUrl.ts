import { config } from "../config";

/**
 * Turn a server-relative upload path like `/uploads/menu/foo.jpg` into an
 * absolute URL pointing at the API origin. Already-absolute URLs are returned
 * unchanged. Null / undefined / empty string return null.
 */
export function absUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${config.apiUrl}${u}`;
  return u;
}
