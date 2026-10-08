import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1000 } });
page.on("pageerror", (e) => console.log("ERROR", e.stack));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
await page.goto("http://localhost:5174/admin/login");
await page.getByLabel("Email address").fill("admin@mercury.local");
await page.getByLabel("Password", { exact: true }).fill("admin123");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForTimeout(2500);
console.log("URL", page.url());
console.log((await page.locator("body").innerText()).slice(0, 9000));
console.log(
  await page.evaluate(() => ({
    session: sessionStorage.getItem("mercury-admin-session"),
    db: localStorage.getItem("mercury-admin-v1")?.slice(0, 100),
  })),
);
await page.screenshot({ path: "/tmp/mercury-admin-diagnose.png" });
await browser.close();
