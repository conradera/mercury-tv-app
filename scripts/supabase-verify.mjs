import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
const url = env.VITE_SUPABASE_URL,
  key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !env.MERCURY_ADMIN_PASSWORD)
  throw new Error("Set Supabase public env vars and MERCURY_ADMIN_PASSWORD.");
const client = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const admin = client(),
  viewer = client(),
  anonymous = client();
const { data: session, error: loginError } =
  await admin.auth.signInWithPassword({
    email: env.MERCURY_ADMIN_EMAIL || "knl.conrad@gmail.com",
    password: env.MERCURY_ADMIN_PASSWORD,
  });
assert.ifError(loginError);
const { data: owner, error: ownerError } = await admin
  .from("users")
  .select("*")
  .eq("id", session.user.id)
  .single();
assert.ifError(ownerError);
assert.equal(owner.is_owner, true);
console.log("PASS: owner login and profile");
for (const table of [
  "users",
  "roles",
  "products",
  "categories",
  "media",
  "campaigns",
  "playlists",
  "screens",
  "groups",
  "branches",
  "schedules",
  "announcements",
  "themes",
  "layouts",
  "settings",
  "activity_logs",
  "notifications",
  "versions",
  "published_screens",
  "ready_records",
  "screen_commands",
]) {
  const { error } = await admin.from(table).select("*").limit(1);
  assert.ifError(error);
}
console.log("PASS: all 21 application tables accessible");
const productId = "verify-" + randomUUID();
try {
  const record = {
    id: productId,
    name: "Verification product",
    status: "draft",
    updatedAt: new Date().toISOString(),
    price: 1000,
  };
  assert.ifError(
    (await admin.from("products").insert({ id: productId, data: record }))
      .error,
  );
  assert.ifError(
    (
      await admin
        .from("products")
        .update({ data: { ...record, status: "published" } })
        .eq("id", productId)
    ).error,
  );
  assert.ifError(
    (
      await admin
        .from("products")
        .update({ data: { ...record, name: "Unpublished edit" } })
        .eq("id", productId)
    ).error,
  );
  const ready = await admin
    .from("ready_records")
    .select("data")
    .eq("id", "products:" + productId)
    .single();
  assert.ifError(ready.error);
  assert.equal(ready.data.data.name, "Verification product");
  const versions = await admin
    .from("versions")
    .select("data")
    .filter("data->>entityId", "eq", productId);
  assert.ifError(versions.error);
  assert.equal(versions.data.length, 2);
  console.log("PASS: content writes, revision history and draft isolation");
} finally {
  assert.ifError(
    (await admin.from("products").delete().eq("id", productId)).error,
  );
}
const roleProtection = await admin
  .from("roles")
  .update({ data: { id: "R001", permissions: [] } })
  .eq("id", "R001");
assert.ok(roleProtection.error);
console.log("PASS: owner role cannot be stripped of permissions");

const { data: visible, error: anonError } = await anonymous
  .from("users")
  .select("*");
assert.ok(anonError || visible.length === 0);
const denied = await anonymous.functions.invoke("admin-users", {
  body: { action: "save", user: {} },
});
assert.ok(denied.error);
console.log("PASS: unauthenticated accounts and user creation blocked");
let created;
const password = randomUUID() + "aA1!";
try {
  const result = await admin.functions.invoke("admin-users", {
    body: {
      action: "save",
      user: {
        id: "temporary",
        name: "Connection verification",
        email: `mercury-check-${randomUUID()}@example.com`,
        password,
        roleId: "R005",
        status: "active",
      },
    },
  });
  if (result.error) {
    const detail = await result.error.context?.json().catch(() => null);
    throw new Error(detail?.error || result.error.message);
  }
  created = result.data;
  assert.ok(created.id);
  assert.equal(created.password, undefined);
  const login = await viewer.auth.signInWithPassword({
    email: created.email,
    password,
  });
  assert.ifError(login.error);
  console.log("PASS: admin creates a real Auth user who can sign in");
  const escalation = await viewer
    .from("users")
    .update({ role_id: "R001" })
    .eq("id", created.id);
  assert.ok(escalation.error);
  const content = await viewer
    .from("products")
    .insert({
      id: "forbidden",
      data: { id: "forbidden", name: "Forbidden", status: "draft" },
    });
  assert.ok(content.error);
  const create = await viewer.functions.invoke("admin-users", {
    body: { action: "save", user: {} },
  });
  assert.ok(create.error);
  console.log(
    "PASS: viewer cannot escalate roles, write content or create users",
  );
  const update = await admin.functions.invoke("admin-users", {
    body: { action: "save", user: { ...created, status: "disabled" } },
  });
  assert.ifError(update.error);
  const inaccessible = await viewer.from("products").select("*");
  assert.ok(inaccessible.error || inaccessible.data.length === 0);
  const blockedLogin = await client().auth.signInWithPassword({
    email: created.email,
    password,
  });
  assert.ok(blockedLogin.error);
  console.log("PASS: disabled account loses data access and cannot sign in");
  const ownerProtection = await admin.functions.invoke("admin-users", {
    body: { action: "delete", ids: [owner.id] },
  });
  assert.ok(ownerProtection.error);
  console.log("PASS: owner deletion blocked");
} finally {
  if (created) {
    const cleanup = await admin.functions.invoke("admin-users", {
      body: { action: "delete", ids: [created.id] },
    });
    assert.ifError(cleanup.error);
    console.log("PASS: temporary user deleted");
  }
  await admin.auth.signOut();
  await viewer.auth.signOut();
}
