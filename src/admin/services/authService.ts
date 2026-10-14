import { supabase, demoEnabled } from "../../utils/supabase/client";
import { apiEnabled, apiRequest } from "./apiClient";
import { currentUser, readDatabase, SESSION_KEY } from "./mockStore";
import type { User } from "../types/models";
export const authService = {
  async login(email: string, password: string, remember: boolean) {
    if (supabase) {
      localStorage.setItem("mercury-remember", String(remember));
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      try {
        const user = await this.me();
        if (!user)
          throw new Error(
            "Your account does not have active workspace access.",
          );
        return user;
      } catch (error) {
        await supabase.auth.signOut();
        throw error;
      }
    }
    if (apiEnabled)
      return apiRequest<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      });
    if (!demoEnabled)
      throw new Error(
        "Workspace connection is not configured. Set the Supabase URL and publishable key.",
      );
    const db = readDatabase();
    const user = db.collections.users.find(
      (u) =>
        String(u.email).toLowerCase() === email.toLowerCase() &&
        u.status === "active",
    ) as User | undefined;
    // DEMO ONLY: all seeded users use admin123. This is not real authentication.
    if (!user || password !== "admin123")
      throw new Error(
        "Incorrect email or password. Use the development account shown below.",
      );
    const session = JSON.stringify({
      userId: user.id,
      expiresAt: Date.now() + 8 * 3600000,
    });
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, session);
    return user;
  },
  async logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    if (apiEnabled) await apiRequest("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
  async me(): Promise<User | null> {
    if (supabase) {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.session.user.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            id: data.id,
            name: data.name,
            email: data.email,
            roleId: data.role_id,
            status: data.status,
            updatedAt: data.updated_at,
            lastLogin: session.session.user.last_sign_in_at || "",
          }
        : null;
    }
    if (!supabase && !apiEnabled && !demoEnabled) return null;
    return apiEnabled
      ? apiRequest<User>("/api/auth/me")
      : currentUser() || null;
  },
};
