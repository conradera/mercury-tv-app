import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1536, height: 1100 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
await page.goto("http://localhost:5174/admin");
await page.getByLabel("Email address").fill("admin@mercury.local");
await page.getByLabel("Password", { exact: true }).fill("admin123");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.getByRole("heading", { name: /Good / }).waitFor();
await page.waitForTimeout(3000);
await page.screenshot({
  path: "/tmp/mercury-admin-overview.png",
  fullPage: true,
});
console.log(
  await page.evaluate(() => ({
    title: document.title,
    size: [innerWidth, innerHeight],
    overflow: [
      document.documentElement.scrollWidth,
      document.documentElement.scrollHeight,
    ],
    db: JSON.parse(localStorage.getItem("mercury-admin-v1")).collections
      .products.length,
  })),
);
await page.goto("http://localhost:5174/admin/products");
await page.getByRole("heading", { name: "Products", exact: true }).waitFor();
await page.screenshot({ path: "/tmp/mercury-admin-products.png" });
await browser.close();
