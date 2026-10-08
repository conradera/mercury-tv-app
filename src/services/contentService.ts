import { signageConfig, screenId } from "../config/signageConfig";
export async function getContent<T>(
  endpoint: string,
  key: string,
  fallback: T,
): Promise<T> {
  if (!signageConfig.apiBaseUrl) return fallback;
  const cacheKey = `mercury:${screenId}:${endpoint}`;
  try {
    const response = await fetch(
      `${signageConfig.apiBaseUrl}/api/signage/${endpoint}?screen=${encodeURIComponent(screenId)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    const data = body[key];
    if (
      !Array.isArray(data) ||
      !data.length ||
      !data.every((item) => item && typeof item.id === "string")
    )
      throw new Error("Invalid content response");
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      /* Cache is optional. */
    }
    return data as T;
  } catch (error) {
    console.warn(
      `Mercury: ${endpoint} unavailable, using local content`,
      error,
    );
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (Array.isArray(cached) && cached.length) return cached as T;
    } catch {
      /* Use bundled content. */
    }
    return fallback;
  }
}
