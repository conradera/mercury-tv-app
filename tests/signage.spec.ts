import { test, expect } from "@playwright/test";

test("TV resolutions fit the viewport and product assets load", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [width, height] of [
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
    [1024, 768],
    [600, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".boot-screen")).toHaveCount(0);
    expect(
      await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
      ]),
    ).toEqual([width, height]);
    await expect(page.locator(".featured-panel h2")).toBeVisible();
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every(
            (img) =>
              (img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("products, ticker, and campaigns rotate without interaction", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  const product = await page.locator(".featured-panel h2").textContent();
  const ticker = await page.locator(".ticker-products").textContent();
  await expect(page.locator(".featured-panel h2")).not.toHaveText(product!, {
    timeout: 12000,
  });
  await expect(page.locator(".ticker-products")).not.toHaveText(ticker!);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power up your semester",
    { timeout: 6000 },
  );
});

test("failed YouTube and custom video skip automatically", async ({ page }) => {
  await page.route("**/*youtube*/**", (route) => route.abort());
  await page.route("**/videos/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power up your semester",
  );
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power your business",
    { timeout: 16000 },
  );
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Connected and protected",
    { timeout: 16000 },
  );
});

test("image and logo errors have branded fallbacks; display mode hides controls", async ({
  page,
}) => {
  await page.route("**/products/**", (route) => route.abort());
  await page.route("**/mercury-logo.png", (route) => route.abort());
  await page.goto("/?mode=display&debug=true&screen=counter-01");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".featured-image .image-fallback")).toBeVisible();
  await expect(page.locator(".header .brand-logo strong")).toContainText(
    "mercury",
  );
  await expect(page.getByRole("button", { name: "Next media" })).toHaveCount(0);
  await expect(page.locator(".debug-panel")).toContainText("counter-01");
  await expect(page.locator("body")).toHaveClass("cursor-hidden", {
    timeout: 5000,
  });
});

test("media controls work and offline display keeps rotating", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "Unmute media", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mute media", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show Lenovo IdeaPad 1", exact: true })
    .click();
  await expect(page.locator(".featured-panel h2")).toHaveText(
    "Lenovo IdeaPad 1",
  );
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect(
    page.getByRole("button", { name: "Enter fullscreen" }),
  ).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power up your semester",
    { timeout: 15000 },
  );
});

test("native local video plays and advances on natural end", async ({
  page,
}) => {
  await page.route("**/*youtube*/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power up your semester",
  );
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Power your business",
    { timeout: 16000 },
  );
  await page.getByRole("button", { name: "Next media" }).click();
  await expect(page.locator(".video-layer.ready")).toBeVisible();
  expect(
    await page.locator("video").evaluate((v) => (v as HTMLVideoElement).muted),
  ).toBe(true);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Connected and protected",
    { timeout: 12000 },
  );
});

test("all failed media falls back to rotating local products", async ({
  page,
}) => {
  await page.route("**/src/data/mockMedia.ts*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'export const mockMedia = [{id:"bad",type:"video",title:"Bad video",url:"/missing.webm"}];',
    }),
  );
  await page.route("**/missing.webm", (route) => route.abort());
  await page.goto("/?debug=true");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".debug-panel")).toContainText(
    "Local product rotation",
  );
  const name = await page.locator(".now-playing strong").textContent();
  await expect(page.locator(".now-playing strong")).not.toHaveText(name!, {
    timeout: 14000,
  });
  await expect(page.locator(".campaign-copy").last()).toBeVisible();
});
