import { demoEnabled } from "../utils/supabase/client";
import type { WebsiteProduct } from "../../supabase/functions/_shared/mercuryCatalog";
import type { Entity } from "../admin/types/models";
const endpoint = import.meta.env.VITE_MERCURY_PRODUCTS_URL || "";
export const websiteProductsEnabled = !demoEnabled && !!endpoint;
const cacheKey = `mercury-website-catalog:${endpoint}`;
const ttl = 60000;
export interface WebsiteCatalog {
  products: WebsiteProduct[];
  fetchedAt: string;
  stale: boolean;
}
let memory: WebsiteCatalog | undefined;
let loadedAt = 0;
let pending: Promise<WebsiteCatalog> | undefined;
function valid(value: unknown): value is WebsiteCatalog {
  const v = value as WebsiteCatalog;
  return (
    !!v &&
    Array.isArray(v.products) &&
    typeof v.fetchedAt === "string" &&
    Number.isFinite(Date.parse(v.fetchedAt)) &&
    v.products.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        p.source === "mercury-website" &&
        typeof p.name === "string" &&
        Array.isArray(p.specifications),
    )
  );
}
export async function getWebsiteCatalog(): Promise<WebsiteCatalog> {
  if (!websiteProductsEnabled)
    throw new Error("Website products are not configured.");
  if (memory && Date.now() - loadedAt < ttl) return memory;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(55000),
      });
      if (!response.ok)
        throw new Error(`Website products unavailable (${response.status}).`);
      const value = await response.json();
      if (!valid(value)) throw new Error("Invalid product catalog response.");
      memory = value;
      loadedAt = Date.now();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(value));
      } catch {
        /* Optional offline cache. */
      }
      return value;
    } catch (error) {
      let saved = memory;
      if (!saved) {
        try {
          saved = JSON.parse(localStorage.getItem(cacheKey) || "null");
        } catch {
          /* No cache. */
        }
      }
      if (valid(saved) && Date.now() - Date.parse(saved.fetchedAt) < 86400000)
        return { ...saved, stale: true };
      throw error;
    }
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
export const websiteFields = new Set([
  "id",
  "name",
  "slug",
  "category",
  "brand",
  "image",
  "additionalImages",
  "price",
  "promotionalPrice",
  "currency",
  "availability",
  "specifications",
]);
// Preserve signage controls while the website stays authoritative for product facts.
export function mergeWebsiteProducts(
  local: Entity[],
  website: WebsiteProduct[],
): Entity[] {
  const overrides = new Map(local.map((p) => [p.id, p]));
  return [
    ...website.map((product) => {
      const overlay = overrides.get(product.id);
      const merged = { ...product, ...overlay } as Entity;
      for (const key of websiteFields) merged[key] = product[key];
      merged.source = product.source;
      merged.sourceId = product.sourceId;
      return merged;
    }),
    ...local.filter(
      (p) => !p.id.startsWith("website:") && p.source !== "mercury-website",
    ),
  ];
}
