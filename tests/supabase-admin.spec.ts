import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { randomUUID } from "node:crypto";
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
test("Supabase admin signs in, creates a real user, and persists it after reload", async ({
  page,
}) => {
  test.skip(
    !env.MERCURY_ADMIN_PASSWORD,
    "Live verification requires MERCURY_ADMIN_PASSWORD.",
  );
  test.setTimeout(90000);
  const client = createClient(
    env.VITE_SUPABASE_URL!,
    env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const email = `mercury-ui-${randomUUID()}@example.com`;
  let createdId: string | undefined;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto("/admin/login");
    await expect(
      page.getByText("Development workspace", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByLabel("Email address")
      .fill(env.MERCURY_ADMIN_EMAIL || "knl.conrad@gmail.com");
    await page
      .getByLabel("Password", { exact: true })
      .fill(env.MERCURY_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Good / })).toBeVisible();
    await page.goto("/admin/users");
    await expect(
      page.getByText("knl.conrad@gmail.com", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add user", exact: true }).click();
    await page
      .getByLabel("Name", { exact: true })
      .fill("Supabase UI Verification");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(randomUUID() + "Aa1!");
    await page.getByLabel("Role", { exact: true }).selectOption("R005");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const login = await client.auth.signInWithPassword({
      email: env.MERCURY_ADMIN_EMAIL || "knl.conrad@gmail.com",
      password: env.MERCURY_ADMIN_PASSWORD!,
    });
    expect(login.error).toBeNull();
    const { data } = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    createdId = data?.id;
    if (createdId) {
      const cleanup = await client.functions.invoke("admin-users", {
        body: { action: "delete", ids: [createdId] },
      });
      expect(cleanup.error).toBeNull();
    }
    await client.auth.signOut();
  }
});
