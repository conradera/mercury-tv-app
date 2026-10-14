import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return respond({ error: "Method not allowed" }, 405);
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return respond({ error: "Sign in to continue." }, 401);
  const {
    data: { user: caller },
    error: authError,
  } = await client.auth.getUser(token);
  if (authError || !caller) return respond({ error: "Invalid session." }, 401);
  const { data: profile, error: profileError } = await client
    .from("users")
    .select("role_id,status")
    .eq("id", caller.id)
    .single();
  if (profileError || profile.status !== "active")
    return respond({ error: "Active workspace access required." }, 403);
  const { data: role, error: roleError } = await client
    .from("roles")
    .select("data")
    .eq("id", profile.role_id)
    .single();
  if (roleError || !role.data.permissions?.includes("users"))
    return respond({ error: "User management permission required." }, 403);
  try {
    const body = await req.json();
    if (body.action === "delete") {
      if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 50)
        return respond({ error: "Choose 1–50 users." }, 400);
      const { data: targets, error } = await client
        .from("users")
        .select("id,is_owner")
        .in("id", body.ids);
      if (error) throw error;
      if (targets.length !== body.ids.length)
        return respond({ error: "One or more users no longer exist." }, 409);
      if (targets.some((u) => u.is_owner || u.id === caller.id))
        return respond(
          { error: "The owner and your own account cannot be deleted." },
          403,
        );
      // Removing the profile immediately removes RLS access even for unexpired JWTs.
      for (const target of targets) {
        const { error } = await client.auth.admin.deleteUser(target.id);
        if (error) throw error;
      }
      return respond({ ok: true });
    }
    if (body.action !== "save")
      return respond({ error: "Unknown action." }, 400);
    const value = body.user || {};
    const name = String(value.name || "").trim();
    const email = String(value.email || "")
      .trim()
      .toLowerCase();
    const password = typeof value.password === "string" ? value.password : "";
    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !["active", "disabled"].includes(value.status)
    )
      return respond(
        { error: "A name, valid email and account status are required." },
        400,
      );
    const { data: targetRole, error: targetRoleError } = await client
      .from("roles")
      .select("id")
      .eq("id", value.roleId)
      .single();
    if (targetRoleError || !targetRole)
      return respond({ error: "Choose an existing role." }, 400);
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let existing = null;
    if (uuid.test(String(value.id))) {
      const result = await client
        .from("users")
        .select("*")
        .eq("id", value.id)
        .maybeSingle();
      if (result.error) throw result.error;
      existing = result.data;
    }
    if ((!existing || password) && password.length < 8)
      return respond(
        { error: "Use a password of at least 8 characters." },
        400,
      );
    if (
      existing?.is_owner &&
      (value.roleId !== existing.role_id || value.status !== "active")
    )
      return respond({ error: "The owner must retain full access." }, 403);
    if (
      existing?.id === caller.id &&
      (value.roleId !== existing.role_id || value.status !== "active")
    )
      return respond({ error: "You cannot remove your own access." }, 403);
    let id: string;
    if (existing) {
      const { error } = await client.auth.admin.updateUserById(existing.id, {
        email,
        ...(password ? { password } : {}),
        ban_duration: value.status === "disabled" ? "876000h" : "none",
      });
      if (error) throw error;
      id = existing.id;
    } else {
      const { data, error } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
        ban_duration: value.status === "disabled" ? "876000h" : "none",
      });
      if (error) throw error;
      id = data.user.id;
    }
    const row = {
      id,
      name,
      email,
      role_id: value.roleId,
      status: value.status,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from("users").upsert(row);
    if (error) {
      if (!existing) await client.auth.admin.deleteUser(id);
      throw error;
    }
    return respond({
      id,
      name,
      email,
      roleId: row.role_id,
      status: row.status,
      updatedAt: row.updated_at,
      lastLogin: "",
    });
  } catch (error) {
    return respond(
      {
        error:
          error instanceof Error
            ? error.message
            : String(
                (error as { message?: string })?.message ||
                  "Unable to manage this account.",
              ),
      },
      400,
    );
  }
});
