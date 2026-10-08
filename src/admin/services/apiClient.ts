const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
export const apiEnabled = !!baseUrl;
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Request failed (${response.status}). Please retry.`);
  return response.status === 204 ? (undefined as T) : response.json();
}
// Production adapter should use server sessions and server-enforced authorization.
// Never place private keys or long-lived bearer tokens in VITE_* variables.
