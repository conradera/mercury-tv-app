import { test, expect } from "@playwright/test";

const productName =
  "12U Wall Mount Server Rack Cabinet 600x450mm Lockable Glass Door";

test("website products render with UGX prices and Mercury orange", async ({
  page,
}) => {
  await page.goto("/?mode=display");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".feature-price")).toContainText("UGX", {
    timeout: 60_000,
  });
  await expect(page.locator(".feature-price")).not.toContainText("USD");
  await expect(page.locator(".media-panel")).toHaveCSS(
    "background-color",
    "rgb(235, 98, 40)",
  );
  await expect(page.locator(".ticker-product").first()).toBeVisible();
});

test("the admin product library reads the live website catalog", async ({
  page,
}) => {
  test.setTimeout(90_000);
  test.skip(
    !process.env.MERCURY_ADMIN_PASSWORD,
    "Live admin verification requires MERCURY_ADMIN_PASSWORD.",
  );
  await page.goto("/admin/login");
  await page
    .getByLabel("Email address")
    .fill(process.env.MERCURY_ADMIN_EMAIL || "knl.conrad@gmail.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.MERCURY_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Good / })).toBeVisible({
    timeout: 60_000,
  });
  await page.goto("/admin/products");
  await expect(page.getByText(productName, { exact: true })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("USD 132.28", { exact: true })).toBeVisible();
  await expect(page.getByText(/Live Mercury website catalog/)).toBeVisible();
});
