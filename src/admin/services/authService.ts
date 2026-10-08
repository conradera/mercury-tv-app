import { apiEnabled, apiRequest } from "./apiClient";
import { currentUser, readDatabase, SESSION_KEY } from "./mockStore";
import type { User } from "../types/models";
export const authService = {
  async login(email: string, password: string, remember: boolean) {
    if (apiEnabled)
      return apiRequest<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      });
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
    if (apiEnabled) await apiRequest("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
  async me() {
    return apiEnabled
      ? apiRequest<User>("/api/auth/me")
      : currentUser() || null;
  },
};
