import { supabaseEnabled } from "../../utils/supabase/client";
import { supabaseService } from "./supabaseService";
import { apiEnabled, apiRequest } from "./apiClient";
import {
  readDatabase,
  persist,
  saveRecord,
  assertPermission,
  collectionPermission,
  audit,
} from "./mockStore";
import { compileScreen } from "./configCompiler";
import type {
  Collection,
  Entity,
  Screen,
  Database,
  SignageTheme,
  DisplayLayout,
  Settings,
  ScreenCommand,
} from "../types/models";
let simulateFailure = false;
export function setSimulateFailure(value: boolean) {
  simulateFailure = value;
}
export const adminService = {
  async getDatabase(): Promise<Database> {
    if (supabaseEnabled) return supabaseService.getDatabase();
    if (simulateFailure) {
      simulateFailure = false;
      throw new Error(
        "Simulated API failure. Retry to restore the local adapter.",
      );
    }
    return apiEnabled ? apiRequest("/api/admin/bootstrap") : readDatabase();
  },
  async save(collection: Collection, value: Entity) {
    if (supabaseEnabled) return supabaseService.save(collection, value);
    return apiEnabled
      ? apiRequest<Entity>(
          `/api/admin/${collection}/${encodeURIComponent(value.id)}`,
          { method: "PUT", body: JSON.stringify(value) },
        )
      : saveRecord(collection, value);
  },
  async remove(collection: Collection, ids: string[]) {
    if (supabaseEnabled) return supabaseService.remove(collection, ids);
    if (apiEnabled)
      return apiRequest(`/api/admin/${collection}/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    const db = readDatabase();
    assertPermission(collectionPermission[collection], db);
    if (
      collection === "categories" &&
      db.collections.products.some((p) =>
        db.collections.categories.some(
          (c) => ids.includes(c.id) && c.name === p.category,
        ),
      )
    )
      throw new Error(
        "Move products to another category before deleting this category.",
      );
    if (collection === "users" && ids.includes("U001"))
      throw new Error("The demo owner account cannot be deleted.");
    if (
      collection === "media" &&
      db.collections.playlists.some((p) =>
        (p.items as { refId: string }[]).some((i) => ids.includes(i.refId)),
      )
    )
      throw new Error("Remove media from its playlists before deleting it.");
    if (
      collection === "roles" &&
      db.collections.users.some((u) => ids.includes(String(u.roleId)))
    )
      throw new Error("Reassign users before deleting an assigned role.");
    if (
      collection === "branches" &&
      db.collections.screens.some((s) => ids.includes(String(s.branchId)))
    )
      throw new Error("Move screens to another branch before deleting.");
    if (
      collection === "groups" &&
      db.collections.screens.some((s) => ids.includes(String(s.groupId)))
    )
      throw new Error("Reassign screens before deleting their group.");
    if (
      collection === "playlists" &&
      (db.collections.screens as Screen[]).some((s) =>
        ids.includes(s.config.playlist),
      )
    )
      throw new Error("Reassign screens before deleting their playlist.");
    ids.forEach((id) => {
      if (db.readyRecords) delete db.readyRecords[`${collection}:${id}`];
    });
    db.collections[collection] = db.collections[collection].filter(
      (r) => !ids.includes(r.id),
    );
    if (collection === "screens") ids.forEach((id) => delete db.published[id]);
    audit(db, "Deleted", `${ids.length} ${collection}`, collection);
    persist(db);
  },
  async publish(screenIds: string[]) {
    if (supabaseEnabled) return supabaseService.publish(screenIds);
    if (apiEnabled)
      return apiRequest("/api/admin/publish", {
        method: "POST",
        body: JSON.stringify({ screenIds }),
      });
    const db = readDatabase();
    assertPermission("publish", db);
    if (!screenIds.length) throw new Error("Choose at least one screen.");
    for (const screen of db.collections.screens as Screen[]) {
      if (screenIds.includes(screen.id)) {
        db.published[screen.id] = compileScreen(db, screen);
        screen.updatedAt = new Date().toISOString();
      }
    }
    audit(
      db,
      "Published configuration",
      `${screenIds.length} screens`,
      "screens",
    );
    persist(db);
  },
  async command(ids: string[], command: ScreenCommand) {
    if (supabaseEnabled) return supabaseService.command(ids, command);
    if (apiEnabled)
      return apiRequest("/api/screens/commands", {
        method: "POST",
        body: JSON.stringify({ ids, command }),
      });
    const db = readDatabase();
    assertPermission("screens", db);
    for (const screen of db.collections.screens as Screen[]) {
      if (!ids.includes(screen.id)) continue;
      if (command === "disable") screen.status = "offline";
      else if (command === "maintenance") screen.status = "maintenance";
      else if (command === "sync") screen.status = "online";
      const config = db.published[screen.id];
      if (config) {
        if (command === "mute" || command === "unmute")
          config.settings.muted = command === "mute";
        if (command === "pause" || command === "resume")
          config.settings.paused = command === "pause";
      }
      screen.lastSeen = new Date().toISOString();
    }
    audit(db, `Simulated ${command}`, `${ids.length} screens`, "screens");
    persist(db);
  },
  async applyAppearance(
    ids: string[],
    patch: { theme?: string; layout?: string },
  ) {
    if (supabaseEnabled) return supabaseService.applyAppearance(ids, patch);
    if (apiEnabled)
      return apiRequest("/api/themes/apply", {
        method: "POST",
        body: JSON.stringify({ screenIds: ids, ...patch }),
      });
    const db = readDatabase();
    assertPermission("themes", db);
    assertPermission("publish", db);
    for (const screen of db.collections.screens as Screen[]) {
      if (!ids.includes(screen.id)) continue;
      screen.config = { ...screen.config, ...patch };
      db.published[screen.id] = compileScreen(db, screen);
    }
    audit(db, "Published appearance", `${ids.length} screens`, "themes");
    persist(db);
  },
  async saveTheme(theme: SignageTheme) {
    if (supabaseEnabled) return supabaseService.saveTheme(theme);
    if (apiEnabled)
      return apiRequest(`/api/themes/${theme.id}`, {
        method: "PUT",
        body: JSON.stringify(theme),
      });
    const db = readDatabase();
    assertPermission("themes", db);
    const i = db.themes.findIndex((t) => t.id === theme.id);
    if (i < 0) db.themes.push(theme);
    else db.themes[i] = theme;
    audit(db, "Saved theme draft", theme.name, "themes");
    persist(db);
  },
  async saveLayout(layout: DisplayLayout) {
    if (supabaseEnabled) return supabaseService.saveLayout(layout);
    if (apiEnabled)
      return apiRequest(`/api/layouts/${layout.id}`, {
        method: "PUT",
        body: JSON.stringify(layout),
      });
    const db = readDatabase();
    assertPermission("themes", db);
    db.layouts = db.layouts.map((l) => (l.id === layout.id ? layout : l));
    audit(db, "Saved layout draft", layout.name, "themes");
    persist(db);
  },
  async saveSettings(settings: Settings) {
    if (supabaseEnabled) return supabaseService.saveSettings(settings);
    if (apiEnabled)
      return apiRequest("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
    const db = readDatabase();
    assertPermission("settings", db);
    db.settings = settings;
    audit(
      db,
      "Saved settings draft",
      "Company and display settings",
      "settings",
    );
    persist(db);
  },
  async readNotifications(ids: string[]) {
    if (supabaseEnabled) return supabaseService.readNotifications(ids);
    if (apiEnabled)
      return apiRequest("/api/admin/notifications/read", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    const db = readDatabase();
    db.notifications.forEach((n) => {
      if (ids.includes(n.id)) n.read = true;
    });
    persist(db);
  },
  async restore(versionId: string) {
    if (supabaseEnabled) return supabaseService.restore(versionId);
    const db = readDatabase();
    const v = db.versions.find((v) => v.id === versionId);
    if (v) return this.save(v.collection, { ...v.value, status: "draft" });
  },
  async reset() {
    if (supabaseEnabled)
      throw new Error(
        "Demo reset is unavailable for a connected Supabase workspace.",
      );
    assertPermission("settings");
    localStorage.removeItem("mercury-admin-v1");
    readDatabase();
    window.dispatchEvent(new Event("mercury:database"));
  },
};
