/** Public product fields only. No private API payloads or credentials leave the proxy. */
export interface WebsiteProduct {
  id: string;
  source: "mercury-website";
  sourceId: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  image: string;
  additionalImages: string[];
  price?: number;
  promotionalPrice?: number;
  currency: "USD";
  specifications: string[];
  availability: "in_stock" | "out_of_stock" | "limited" | "coming_soon";
  featured: boolean;
  promotionLabel: string;
  status: string;
  updatedAt: string;
  sidebarVisible: boolean;
  tickerVisible: boolean;
  displayPriority: number;
  [key: string]: unknown;
}
const string = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const amount = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const imageUrl = (v: unknown) => {
  const value = string(v);
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};
export function normalizeWebsiteProduct(
  raw: Record<string, unknown>,
): WebsiteProduct | null {
  const sourceId = string(raw.id),
    name = string(raw.name);
  // Only public listings are forwarded; drafts and unknown statuses stay private.
  const status = string(raw.status).toLowerCase();
  if (
    !sourceId ||
    !name ||
    ![
      "published",
      "active",
      "in_stock",
      "out_of_stock",
      "limited",
      "coming_soon",
    ].includes(status)
  )
    return null;
  const current = amount(raw.priceUsd),
    old = amount(raw.oldPriceUsd);
  const discounted =
    current !== undefined && old !== undefined && old > current;
  const images = [
    ...new Set(
      [raw.image, ...(Array.isArray(raw.images) ? raw.images : [])]
        .map(imageUrl)
        .filter(Boolean),
    ),
  ];
  const specs =
    raw.specifications &&
    typeof raw.specifications === "object" &&
    !Array.isArray(raw.specifications)
      ? (raw.specifications as Record<string, unknown>)
      : {};
  const preferred = [
    "processor",
    "ram",
    "storage",
    "storageType",
    "displaySize",
    "displayResolution",
    "graphics",
    "operatingSystem",
  ];
  const specificationValues = [
    ...preferred,
    ...Object.keys(specs).filter((k) => !preferred.includes(k)),
  ]
    .map((k) => string(specs[k]))
    .filter(Boolean);
  const summary = string(raw.shortDescription)
    .split(/\s*\|\s*/)
    .filter(Boolean);
  const stock = amount(raw.stock);
  const availability =
    status === "coming_soon"
      ? "coming_soon"
      : status === "out_of_stock" || stock === 0
        ? "out_of_stock"
        : status === "limited" || (stock !== undefined && stock <= 3)
          ? "limited"
          : "in_stock";
  return {
    id: `website:${sourceId}`,
    source: "mercury-website",
    sourceId,
    slug: sourceId,
    name,
    category: string(raw.category) || string(raw.categoryId) || "Products",
    brand: string(raw.brand),
    image: images[0] || "",
    additionalImages: images.slice(1),
    price: discounted ? old : current,
    ...(discounted ? { promotionalPrice: current } : {}),
    currency: "USD",
    specifications: [
      ...new Set(specificationValues.length ? specificationValues : summary),
    ].slice(0, 12),
    availability,
    featured: raw.featured === true || raw.isNew === true,
    promotionLabel: discounted
      ? "HOT DEAL"
      : raw.isNew === true
        ? "NEW ARRIVAL"
        : "AVAILABLE AT MERCURY",
    status: "published",
    updatedAt: string(raw.updatedAt) || "1970-01-01T00:00:00.000Z",
    sidebarVisible: true,
    tickerVisible: true,
    displayPriority: 5,
  };
}
export async function fetchWebsiteCatalog(
  apiKey: string,
  fetcher: typeof fetch = fetch,
) {
  const products = new Map<string, WebsiteProduct>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < 100; page++) {
    const url = new URL(
      "https://us-central1-mercurycomputers-tech.cloudfunctions.net/api/v1/products",
    );
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetcher(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(`Website products request failed (${response.status}).`);
    const body = await response.json();
    if (
      !Array.isArray(body.data) ||
      !(body.nextCursor === null || typeof body.nextCursor === "string")
    )
      throw new Error("Invalid website catalog response.");
    for (const raw of body.data) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw new Error("Invalid website product.");
      const product = normalizeWebsiteProduct(raw);
      if (product) products.set(product.id, product);
    }
    if (body.nextCursor === null) return [...products.values()];
    if (!body.nextCursor || cursors.has(body.nextCursor))
      throw new Error("Website catalog pagination repeated a cursor.");
    cursors.add(body.nextCursor);
    cursor = body.nextCursor;
  }
  throw new Error("Website catalog exceeded the pagination limit.");
}
