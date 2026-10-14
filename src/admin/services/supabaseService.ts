import {
  getWebsiteCatalog,
  mergeWebsiteProducts,
  websiteProductsEnabled,
} from "../../services/websiteProductService";
import { supabase } from "../../utils/supabase/client";
import { compileScreen } from "./configCompiler";
import type {
  Collection,
  Database,
  Entity,
  Screen,
  Settings,
  SignageTheme,
  DisplayLayout,
  ScreenCommand,
} from "../types/models";

const collections: Collection[] = [
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
  "users",
  "roles",
];
const dbClient = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};
async function rows(table: string) {
  const { data, error } = await dbClient().from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}
async function write(table: string, id: string, data: unknown) {
  const { error } = await dbClient()
    .from(table)
    .upsert({ id, data })
    .select("id")
    .single();
  if (error) throw error;
}
async function manageUsers(body: Record<string, unknown>) {
  const { data, error } = await dbClient().functions.invoke("admin-users", {
    body,
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    const detail = context ? await context.json().catch(() => null) : null;
    throw new Error(detail?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
export const supabaseService = {
  async getDatabase(): Promise<Database> {
    const tables = [
      ...collections,
      "themes",
      "layouts",
      "settings",
      "activity_logs",
      "notifications",
      "versions",
      "published_screens",
      "ready_records",
    ];
    const results = await Promise.all(
      tables.map(async (table) => [table, await rows(table)] as const),
    );
    const values = Object.fromEntries(results);
    const settings = values.settings.find((r) => r.id === "company")?.data;
    if (!settings)
      throw new Error(
        "Workspace settings are missing. Run the Supabase setup migration.",
      );
    const all = Object.fromEntries(
      collections.map((table) => [
        table,
        values[table].map((r) =>
          table === "users"
            ? {
                id: r.id,
                name: r.name,
                email: r.email,
                roleId: r.role_id,
                status: r.status,
                updatedAt: r.updated_at,
                lastLogin: "",
              }
            : r.data,
        ),
      ]),
    ) as Database["collections"];
    if (websiteProductsEnabled) {
      const catalog = await getWebsiteCatalog();
      all.products = mergeWebsiteProducts(all.products, catalog.products);
      const existing = new Set(all.categories.map((c) => c.name));
      for (const product of catalog.products) {
        if (!existing.has(product.category)) {
          existing.add(product.category);
          all.categories.push({
            id: `website-category:${product.category}`,
            name: product.category,
            status: "active",
            updatedAt: product.updatedAt,
            icon: "Package",
            color: "#3159ba",
            order: all.categories.length,
          });
        }
      }
    }
    return {
      schemaVersion: 1,
      revision: Date.now(),
      collections: all,
      settings,
      themes: values.themes.map((r) => r.data),
      layouts: values.layouts.map((r) => r.data),
      logs: values.activity_logs
        .map((r) => r.data)
        .sort((a, b) => b.time.localeCompare(a.time)),
      notifications: values.notifications.map((r) => r.data),
      versions: values.versions
        .map((r) => r.data)
        .sort((a, b) => b.time.localeCompare(a.time)),
      published: Object.fromEntries(
        values.published_screens.map((r) => [r.id, r.data]),
      ),
      readyRecords: Object.fromEntries(
        values.ready_records.map((r) => [r.id, r.data]),
      ),
    };
  },
  async save(collection: Collection, value: Entity): Promise<Entity> {
    if (collection === "users")
      return manageUsers({ action: "save", user: value });
    const clean = { ...value, updatedAt: new Date().toISOString() };
    await write(collection, clean.id, clean);
    return clean;
  },
  async remove(collection: Collection, ids: string[]) {
    if (
      collection === "products" &&
      ids.some((id) => id.startsWith("website:"))
    )
      throw new Error(
        "Website products are managed on the Mercury website. Set display visibility here instead.",
      );
    if (
      collection === "categories" &&
      ids.some((id) => id.startsWith("website-category:"))
    )
      throw new Error("Website categories are managed on the Mercury website.");
    if (collection === "users") {
      await manageUsers({ action: "delete", ids });
      return;
    }
    const { error, data } = await dbClient()
      .from(collection)
      .delete()
      .in("id", ids)
      .select("id");
    if (error) throw error;
    if (data?.length !== ids.length)
      throw new Error(
        "Some records could not be deleted. Check your permissions and refresh.",
      );
  },
  async publish(screenIds: string[]) {
    if (!screenIds.length) throw new Error("Choose at least one screen.");
    const db = await this.getDatabase();
    const snapshots = screenIds.map((id) => {
      const screen = db.collections.screens.find((s) => s.id === id) as
        Screen | undefined;
      if (!screen) throw new Error(`Screen ${id} was not found.`);
      return { id, data: compileScreen(db, screen) };
    });
    const { error } = await dbClient()
      .from("published_screens")
      .upsert(snapshots);
    if (error) throw error;
  },
  async command(ids: string[], command: ScreenCommand) {
    const { error } = await dbClient()
      .from("screen_commands")
      .insert(ids.map((screen_id) => ({ screen_id, command })));
    if (error) throw error;
  },
  async applyAppearance(
    ids: string[],
    patch: { theme?: string; layout?: string },
  ) {
    const db = await this.getDatabase();
    for (const screen of db.collections.screens as Screen[]) {
      if (ids.includes(screen.id))
        await this.save("screens", {
          ...screen,
          config: { ...screen.config, ...patch },
        });
    }
    await this.publish(ids);
  },
  saveTheme: (theme: SignageTheme) => write("themes", theme.id, theme),
  saveLayout: (layout: DisplayLayout) => write("layouts", layout.id, layout),
  saveSettings: (settings: Settings) => write("settings", "company", settings),
  async readNotifications(ids: string[]) {
    const all = await rows("notifications");
    for (const row of all.filter((r) => ids.includes(r.id)))
      await write("notifications", row.id, { ...row.data, read: true });
  },
  async restore(versionId: string) {
    const { data, error } = await dbClient()
      .from("versions")
      .select("data")
      .eq("id", versionId)
      .single();
    if (error) throw error;
    return this.save(data.data.collection, {
      ...data.data.value,
      status: "draft",
    });
  },
};
