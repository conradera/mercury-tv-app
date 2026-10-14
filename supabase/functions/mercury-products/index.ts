import {
  fetchWebsiteCatalog,
  type WebsiteProduct,
} from "../_shared/mercuryCatalog.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const ttl = 60000;
const maxStale = 86400000;
type Catalog = { products: WebsiteProduct[]; fetchedAt: string };
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
let cached: Catalog | undefined;
let pending: Promise<typeof cached> | undefined;
const adminClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey)
    throw new Error("Website product connection is not configured.");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
async function refreshCatalog(): Promise<Catalog> {
  if (!pending)
    pending = (async () => {
      let key = Deno.env.get("MERCURY_PRODUCTS_API_KEY");
      if (!key) {
        const admin = adminClient();
        const { data, error } = await admin.rpc("mercury_products_api_key");
        if (error || typeof data !== "string" || !data)
          throw new Error("Website product connection is not configured.");
        key = data;
      }
      const products = await fetchWebsiteCatalog(key);
      cached = { products, fetchedAt: new Date().toISOString() };
      const { error } = await adminClient()
        .from("website_catalog_cache")
        .upsert({
          id: "products",
          data: products,
          fetched_at: cached.fetchedAt,
        });
      if (error) throw error;
      return cached;
    })().finally(() => {
      pending = undefined;
    });
  return pending;
}
async function catalog(): Promise<Catalog & { stale: boolean }> {
  if (!cached) {
    const { data } = await adminClient()
      .from("website_catalog_cache")
      .select("data,fetched_at")
      .eq("id", "products")
      .maybeSingle();
    if (data && Array.isArray(data.data))
      cached = { products: data.data, fetchedAt: data.fetched_at };
  }
  const age = cached ? Date.now() - Date.parse(cached.fetchedAt) : Infinity;
  if (cached && age < ttl) return { ...cached, stale: false };
  if (cached && age < maxStale) {
    EdgeRuntime.waitUntil(refreshCatalog().catch(() => undefined));
    return { ...cached, stale: true };
  }
  return { ...(await refreshCatalog()), stale: false };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const headers = { ...cors, "Content-Type": "application/json" };
  if (req.method !== "GET")
    return Response.json(
      { error: "Only product reads are supported." },
      { status: 405, headers },
    );
  // Public signage endpoint: fixed upstream products path, curated published fields,
  // no orders, customer information, arbitrary URLs, or write operations.
  try {
    const data = await catalog();
    return Response.json(data, {
      headers: {
        ...headers,
        "Cache-Control": data.stale ? "no-store" : "public, max-age=60",
      },
    });
  } catch {
    // Never replace good data with a partial page or sample prices on an outage.
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < maxStale)
      return Response.json(
        { ...cached, stale: true },
        { headers: { ...headers, "Cache-Control": "no-store" } },
      );
    return Response.json(
      { error: "Website products are temporarily unavailable." },
      { status: 503, headers: { ...headers, "Cache-Control": "no-store" } },
    );
  }
});
