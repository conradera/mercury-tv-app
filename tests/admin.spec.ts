import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email = "admin@mercury.local") {
  await page.goto("/admin");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Good / })).toBeVisible();
}
async function database(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("mercury-admin-v1")!),
  );
}

test("protected login, navigation, search, notifications, and dark mode", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  for (const [path, title] of [
    ["products", "Products"],
    ["media", "Media library"],
    ["campaigns", "Campaigns"],
    ["playlists", "Playlists"],
    ["announcements", "Announcements"],
    ["screens", "Screens"],
    ["groups", "Screen groups"],
    ["layouts", "Layouts"],
    ["schedules", "Schedules"],
    ["preview", "Live preview"],
    ["branches", "Branches"],
    ["devices", "Devices"],
    ["logs", "Activity logs"],
    ["health", "System health"],
    ["analytics/content", "Content analytics"],
    ["analytics/screens", "Screen analytics"],
    ["users", "Users"],
    ["roles", "Roles & permissions"],
    ["settings", "Settings"],
    ["help", "How can we help?"],
  ]) {
    await page.goto("/admin/" + path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Profile menu", exact: true }).click();
  await page.getByRole("button", { name: "dark admin mode" }).click();
  await expect(page.locator(".admin-app")).toHaveClass(/admin-dark/);
  await page.getByRole("button", { name: "Profile menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect
    .poll(
      async () =>
        (await database(page)).notifications.filter(
          (n: { read: boolean }) => !n.read,
        ).length,
    )
    .toBe(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByPlaceholder("Search products, screens, campaigns…")
    .fill("IdeaPad");
  await expect(
    page.getByRole("button", { name: /Lenovo IdeaPad/ }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("product creation, validation, persistence, and draft isolation", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/products");
  const before = await database(page);
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(
    page.getByText("A name is required.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Mercury test laptop");
  await page.getByLabel("Regular price", { exact: true }).fill("2450000");
  await page.getByLabel("Product ID / SKU").fill("P-TEST");
  await page
    .getByRole("button", { name: "Add specification", exact: true })
    .click();
  await page
    .getByLabel("Key specifications 1", { exact: true })
    .fill("16GB RAM");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Search products…", { exact: true })
    .fill("Mercury test laptop");
  await expect(page.getByRole("table")).toContainText("Mercury test laptop");
  await page.reload();
  const after = await database(page);
  expect(
    after.collections.products.find((p: { id: string }) => p.id === "P-TEST")
      .status,
  ).toBe("draft");
  expect(after.published["MERCURY-KLA-001"]).toEqual(
    before.published["MERCURY-KLA-001"],
  );
});

test("playlist reorder persists and publishes the ordered screen configuration", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/playlists?edit=main-showroom");
  await expect(
    page.getByRole("heading", { name: "Playback sequence" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Move Mercury corporate film up",
      exact: true,
    })
    .click();
  await expect(page.locator(".playlist-item-main > b").first()).toHaveText(
    "Mercury corporate film",
  );
  await page.getByRole("button", { name: "Mark ready", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await database(page)).collections.playlists.find(
          (p: { id: string }) => p.id === "main-showroom",
        ).items[0].title,
    )
    .toBe("Mercury corporate film");
  await page.goto("/admin/screens?edit=MERCURY-KLA-001");
  await page
    .getByRole("button", { name: "Publish to screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish to screens", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuration published" }),
  ).toBeVisible();
  const db = await database(page);
  expect(db.published["MERCURY-KLA-001"].media[0].type).toBe("video");
  expect(db.published["MERCURY-KLA-001"].version).toBeGreaterThan(1);
});

test("theme edits update actual TV preview but not published screens until applied", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/settings?tab=Appearance");
  await expect(
    page.getByRole("heading", { name: "Signage appearance" }),
  ).toBeVisible();
  const initial = (await database(page)).published["MERCURY-KLA-001"].themeData
    .colors.accent;
  const picker = page.getByLabel("Accent picker", { exact: true });
  await picker.fill("#ff8844");
  const frame = page.frameLocator('iframe[title="Mercury TV preview"]');
  await expect
    .poll(() =>
      frame
        .locator(":root")
        .evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--lime").trim(),
        ),
    )
    .toBe("#ff8844");
  expect(
    (await database(page)).published["MERCURY-KLA-001"].themeData.colors.accent,
  ).toBe(initial);
  await page.getByRole("button", { name: "Apply theme", exact: true }).click();
  await page
    .getByRole("button", { name: "Apply & publish", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    (await database(page)).published["MERCURY-KLA-001"].themeData.colors.accent,
  ).toBe("#ff8844");
});

test("screen config preserves requested IDs, timing and price visibility", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/screens?edit=MERCURY-KLA-001");
  await page.getByLabel("Show prices", { exact: true }).uncheck();
  await page.getByLabel("Featured rotation (ms)").fill("15000");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish to screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish to screens", exact: true })
    .click();
  const config = (await database(page)).published["MERCURY-KLA-001"];
  expect(config.screenId).toBe("MERCURY-KLA-001");
  expect(config.featuredProducts).toEqual(["P001", "P002", "P003"]);
  expect(config.settings.featuredRotation).toBe(15000);
  expect(config.settings.showPrices).toBe(false);
  await page.goto("/?screen=MERCURY-KLA-001&mode=display");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".feature-price")).toBeHidden();
  expect(
    await page
      .locator(".signage")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(7, 17, 31)");
});

test("uploads persist locally and invalid YouTube URLs are rejected", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/media");
  await page.getByRole("button", { name: "Upload media", exact: true }).click();
  await page
    .getByLabel("Upload image or video", { exact: true })
    .setInputFiles("public/products/hero-laptop.png");
  await expect(page.locator("progress")).toHaveAttribute("value", "100");
  await page
    .getByLabel("Name", { exact: true })
    .fill("Uploaded showroom asset");
  await page
    .getByRole("button", { name: "Mark ready to publish", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(
      async () =>
        (await database(page)).collections.media.find(
          (m: { name: string }) => m.name === "Uploaded showroom asset",
        )?.url,
    )
    .toMatch(/^asset:/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Uploaded showroom asset", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Upload media", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Bad YouTube");
  await page.getByLabel("Media type", { exact: true }).selectOption("youtube");
  await page
    .getByLabel("Media URL or YouTube link", { exact: true })
    .fill("https://example.com/not-youtube");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(
    page.getByText("Enter a valid YouTube URL.", { exact: true }),
  ).toBeVisible();
});

test("viewer is read-only and dashboard adapts to tablet and mobile", async ({
  page,
}) => {
  await login(page, "alex@mercury.local");
  await page.goto("/admin/products");
  await expect(
    page.getByRole("button", { name: "Add product", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/screens");
  await expect(
    page.getByRole("button", { name: "Register screen", exact: true }),
  ).toBeDisabled();
  for (const [width, height] of [
    [1024, 768],
    [600, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Good / })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(page.locator(".admin-sidebar")).toHaveClass(/open/);
});

test("unsaved editor offers stay, discard and save draft", async ({ page }) => {
  await login(page);
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Unsaved laptop");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "You have unsaved changes",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Unsaved laptop",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    (await database(page)).collections.products.some(
      (p: { name: string }) => p.name === "Unsaved laptop",
    ),
  ).toBe(false);
});

test("screen registration and schedule validation save local records", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/screens");
  await page
    .getByRole("button", { name: "Register screen", exact: true })
    .click();
  await page
    .getByLabel("Screen name", { exact: true })
    .fill("Mercury test display");
  await page
    .getByLabel("Playlist", { exact: true })
    .selectOption("main-showroom");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const screen = (await database(page)).collections.screens.find(
    (s: { name: string }) => s.name === "Mercury test display",
  );
  expect(screen.pairingPin).toMatch(/^\d{6}$/);
  expect(screen.config.screenId).toBe(screen.id);
  await page.goto("/admin/schedules");
  await page
    .getByRole("button", { name: "Schedule content", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Test schedule");
  await page
    .getByLabel("Content", { exact: true })
    .selectOption("main-showroom");
  await page.getByLabel("End time", { exact: true }).fill("07:00");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("End time must be later than start time.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("End time", { exact: true }).fill("18:00");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    (await database(page)).collections.schedules.some(
      (s: { name: string }) => s.name === "Test schedule",
    ),
  ).toBe(true);
});

test("emergency publish overrides TV then expires", async ({ page }) => {
  await login(page);
  await page.goto("/admin/announcements");
  await page
    .getByRole("button", { name: "Add announcement", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Closing notice");
  await page.getByLabel("Message", { exact: true }).fill("STORE CLOSING SOON");
  await page
    .getByLabel("Display type", { exact: true })
    .selectOption("emergency");
  await page.getByLabel("Duration (seconds)", { exact: true }).fill("6");
  await page
    .getByRole("button", { name: "Mark ready to publish", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/admin/screens?edit=MERCURY-KLA-001");
  await page
    .getByRole("button", { name: "Publish to screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish to screens", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuration published" }),
  ).toBeVisible();
  await page.goto("/?screen=MERCURY-KLA-001&mode=display");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "STORE CLOSING SOON" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "STORE CLOSING SOON" }),
  ).toHaveCount(0, { timeout: 8000 });
});

test("publishing unrelated changes preserves the last ready product while its edit is a draft", async ({
  page,
}) => {
  await login(page);
  const original = (await database(page)).published[
    "MERCURY-KLA-001"
  ].products.find((p: { id: string }) => p.id === "P001").price;
  await page.goto("/admin/products?edit=P001");
  await page.getByLabel("Regular price", { exact: true }).fill("9999999");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/admin/screens?edit=MERCURY-KLA-001");
  await page
    .getByRole("button", { name: "Publish to screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish to screens", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuration published" }),
  ).toBeVisible();
  const db = await database(page);
  expect(
    db.collections.products.find((p: { id: string }) => p.id === "P001").price,
  ).toBe(9999999);
  expect(
    db.published["MERCURY-KLA-001"].products.find(
      (p: { id: string }) => p.id === "P001",
    ).price,
  ).toBe(original);
});

test("local pairing code registers a screen and opens its TV URL", async ({
  page,
  context,
}) => {
  await login(page);
  const tv = await context.newPage();
  await tv.goto("/?pair=true");
  await expect(
    tv.getByRole("heading", { name: "Pair this screen" }),
  ).toBeVisible();
  const pin = await tv.locator(".pairing-code").textContent();
  expect(pin).toMatch(/^\d{6}$/);
  await page.goto("/admin/screens");
  await page
    .getByRole("button", { name: "Register screen", exact: true })
    .click();
  await page.getByLabel("Screen name", { exact: true }).fill("Paired demo TV");
  await page.getByLabel("Pairing PIN (simulated)", { exact: true }).fill(pin!);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(tv).toHaveURL(/screen=MERCURY-KLA-009/);
  await tv.close();
});

test("published announcement formats and coming-soon availability reach the TV", async ({
  page,
}) => {
  await login(page);
  await page.evaluate(async () => {
    const db = JSON.parse(localStorage.getItem("mercury-admin-v1")!);
    const product = db.collections.products.find(
      (p: { id: string }) => p.id === "P001",
    );
    product.availability = "coming_soon";
    product.status = "published";
    db.collections.announcements = [
      {
        id: "A-test",
        name: "Format check",
        status: "published",
        message: "NEW ARRIVALS TOMORROW",
        type: "banner",
        screenIds: [],
        expiresAt: "",
        duration: 30,
        background: "#123348",
        color: "#ffffff",
        priority: 1,
      },
    ];
    const { compileScreen } =
      await import("/src/admin/services/configCompiler.ts");
    const screen = db.collections.screens.find(
      (s: { id: string }) => s.id === "MERCURY-KLA-001",
    );
    screen.featuredProducts = ["P001"];
    db.published[screen.id] = compileScreen(db, screen);
    localStorage.setItem("mercury-admin-v1", JSON.stringify(db));
  });
  await page.goto("/?screen=MERCURY-KLA-001&mode=display");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.getByText("COMING SOON", { exact: true })).toBeVisible();
  await expect(page.locator(".tv-announcement-banner")).toHaveText(
    "NEW ARRIVALS TOMORROW",
  );
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("mercury-admin-v1")!);
    db.published["MERCURY-KLA-001"].announcements[0].type = "fullscreen";
    localStorage.setItem("mercury-admin-v1", JSON.stringify(db));
  });
  await page.reload();
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".tv-announcement-fullscreen")).toHaveText(
    "NEW ARRIVALS TOMORROW",
  );
});

test("bulk YouTube links validate, publish, play to completion and loop", async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  await expect(page.locator(".admin-mercury-logo")).toBeVisible();
  await expect(page.locator(".nav-item.active")).toHaveCSS(
    "background-color",
    "rgb(37, 150, 190)",
  );
  await page.goto("/admin/playlists?new=1");
  await page
    .getByLabel("Playlist name", { exact: true })
    .fill("Continuous YouTube");
  await page
    .getByRole("button", { name: "Add YouTube links", exact: true })
    .click();
  await page
    .getByLabel("YouTube video links")
    .fill("https://example.com/not-youtube");
  await page.getByRole("button", { name: "Add videos to playlist" }).click();
  await expect(page.getByRole("alert")).toContainText("lines 1");
  await page
    .getByLabel("YouTube video links")
    .fill(
      "https://youtu.be/aqz-KE-bpKQ\nhttps://www.youtube.com/watch?v=M7lc1UVf-VE\nhttps://youtu.be/aqz-KE-bpKQ",
    );
  await page.getByRole("button", { name: "Add videos to playlist" }).click();
  await expect(page.locator(".playlist-item")).toHaveCount(2);
  await expect(page.getByLabel("Loop continuously")).toBeChecked();
  await page.getByRole("button", { name: "Mark ready", exact: true }).click();
  await expect(page.locator(".unsaved-label")).toContainText(
    "All changes saved",
  );
  const db = await database(page);
  const playlist = db.collections.playlists.find(
    (p: { name: string }) => p.name === "Continuous YouTube",
  );
  await page.goto("/admin/screens?edit=MERCURY-KLA-001");
  await page
    .getByRole("combobox", { name: "Playlist", exact: true })
    .selectOption(playlist.id);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Publish to screen", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Publish to screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish to screens", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuration published" }),
  ).toBeVisible();
  expect(
    (await database(page)).published["MERCURY-KLA-001"].media,
  ).toHaveLength(2);
  await page.addInitScript(() => {
    const w = window as any;
    w.ytEvents = [];
    w.YT = {
      Player: class {
        constructor(_node: HTMLElement, options: any) {
          w.ytEvents.push(options.events);
          setTimeout(() => options.events.onReady({ target: this }), 0);
          this.events = options.events;
        }
        events: any;
        mute() {}
        unMute() {}
        destroy() {}
        playVideo() {
          this.events.onStateChange({ data: 1 });
        }
        getCurrentTime() {
          return Date.now() / 1000;
        }
      },
    };
  });
  await page.goto("/?screen=MERCURY-KLA-001&mode=display");
  await expect(page.locator(".video-layer.ready")).toBeVisible();
  await expect(page.locator(".now-playing strong")).toHaveText(
    "YouTube · aqz-KE-bpKQ",
  );
  await page.clock.install();
  await page.clock.fastForward(35000);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "YouTube · aqz-KE-bpKQ",
  );
  await page.evaluate(() =>
    (window as any).ytEvents.at(-1).onStateChange({ data: 0 }),
  );
  await page.clock.runFor(1000);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "YouTube · M7lc1UVf-VE",
  );
  // A delayed callback from the outgoing player must not skip the new video.
  await page.evaluate(() =>
    (window as any).ytEvents.at(-2).onStateChange({ data: 0 }),
  );
  await expect(page.locator(".now-playing strong")).toHaveText(
    "YouTube · M7lc1UVf-VE",
  );
  await page.evaluate(() =>
    (window as any).ytEvents.at(-1).onStateChange({ data: 0 }),
  );
  await page.clock.runFor(1000);
  await expect(page.locator(".now-playing strong")).toHaveText(
    "YouTube · aqz-KE-bpKQ",
  );
});
