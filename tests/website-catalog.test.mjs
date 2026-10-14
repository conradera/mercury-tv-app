import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeWebsiteProduct,
  fetchWebsiteCatalog,
} from "../supabase/functions/_shared/mercuryCatalog.ts";
import {
  convertUsdToUgx,
  DEFAULT_USD_TO_UGX_RATE,
} from "../src/utils/currency.ts";
const product = {
  id: "laptop",
  name: "Laptop",
  status: "published",
  priceUsd: 899.95,
  oldPriceUsd: 999.99,
  stock: 2,
  image: "https://example.com/a.jpg",
  specifications: {
    processor: "Intel i5",
    ram: "16GB",
    battery: "",
    Warranty: "1 year",
  },
};
test("converts website USD prices to whole UGX amounts for signage", () => {
  assert.equal(DEFAULT_USD_TO_UGX_RATE, 4140);
  assert.equal(convertUsdToUgx(132.28), 547639);
  assert.equal(convertUsdToUgx(undefined), undefined);
});
test("normalizes public facts, USD sale prices, stock and specs without exposing arbitrary upstream fields", () => {
  const actual = normalizeWebsiteProduct({
    ...product,
    privateNotes: "internal",
  });
  assert.equal(actual.id, "website:laptop");
  assert.equal(actual.currency, "USD");
  assert.equal(actual.price, 999.99);
  assert.equal(actual.promotionalPrice, 899.95);
  assert.equal(actual.availability, "limited");
  assert.deepEqual(actual.specifications, ["Intel i5", "16GB", "1 year"]);
  assert.equal(actual.privateNotes, undefined);
  assert.equal(normalizeWebsiteProduct({ ...product, status: "draft" }), null);
  assert.equal(
    normalizeWebsiteProduct({ ...product, status: "mystery" }),
    null,
  );
  assert.equal(
    normalizeWebsiteProduct({ ...product, stock: 0 }).availability,
    "out_of_stock",
  );
  assert.equal(
    normalizeWebsiteProduct({ ...product, priceUsd: null, oldPriceUsd: null })
      .price,
    undefined,
  );
  assert.equal(
    normalizeWebsiteProduct({ ...product, image: "javascript:alert(1)" }).image,
    "",
  );
});
test("follows cursor pages to the end and forwards auth only to the fixed products endpoint", async () => {
  const urls = [];
  const products = await fetchWebsiteCatalog(
    "test-secret",
    async (url, init) => {
      urls.push(new URL(url));
      assert.equal(init.headers.Authorization, "Bearer test-secret");
      assert.equal(init.redirect, "error");
      assert.equal(
        url.origin,
        "https://us-central1-mercurycomputers-tech.cloudfunctions.net",
      );
      return Response.json(
        urls.length === 1
          ? { data: [product], nextCursor: "next/page" }
          : { data: [{ ...product, id: "second" }], nextCursor: null },
      );
    },
  );
  assert.equal(products.length, 2);
  assert.equal(urls[1].searchParams.get("cursor"), "next/page");
  assert.equal(urls[0].searchParams.get("limit"), "200");
});
test("rejects partial catalogs and repeated cursors rather than publishing incomplete results", async () => {
  let requests = 0;
  await assert.rejects(
    fetchWebsiteCatalog("test", async () =>
      ++requests === 1
        ? Response.json({ data: [product], nextCursor: "two" })
        : new Response("oops", { status: 503 }),
    ),
    /503/,
  );
  await assert.rejects(
    fetchWebsiteCatalog("test", async () =>
      Response.json({ data: [product], nextCursor: "loop" }),
    ),
    /repeated/,
  );
  await assert.rejects(
    fetchWebsiteCatalog("test", async () =>
      Response.json({ data: {}, nextCursor: null }),
    ),
    /Invalid/,
  );
});
