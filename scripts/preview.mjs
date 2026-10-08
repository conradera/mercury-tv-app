import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => console.error(error));
await page.goto("http://localhost:5173");
await page.waitForTimeout(2600);
await page.screenshot({ path: "/tmp/mercury-preview.png" });
console.log(
  await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    scroll: [
      document.documentElement.scrollWidth,
      document.documentElement.scrollHeight,
    ],
    images: [...document.images]
      .filter((i) => !i.complete || !i.naturalWidth)
      .map((i) => i.src),
  })),
);
await browser.close();
