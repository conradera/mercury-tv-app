import { createSeed } from "../data/seed";
import { compileScreen } from "./configCompiler";
import type {
  Database,
  Screen,
  Permission,
  Session,
  User,
  Role,
  Collection,
  Entity,
} from "../types/models";
export const DB_KEY = "mercury-admin-v1";
export const SESSION_KEY = "mercury-admin-session";
let cached: Database | undefined;
let rawCache: string | null = null;
export function readDatabase(): Database {
  const raw = localStorage.getItem(DB_KEY);
  if (cached && raw === rawCache) return structuredClone(cached);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed.schemaVersion === 1 &&
        parsed.collections &&
        parsed.themes &&
        parsed.published
      ) {
        cached = parsed;
        rawCache = raw;
        return structuredClone(parsed);
      }
    } catch {
      /* Recover seed if corrupt. */
    }
  }
  const seed = createSeed();
  for (const screen of seed.collections.screens as Screen[])
    seed.published[screen.id] = compileScreen(seed, screen);
  persist(seed);
  return structuredClone(seed);
}
export function persist(db: Database) {
  const raw = JSON.stringify(db);
  try {
    localStorage.setItem(DB_KEY, raw);
  } catch {
    throw new Error(
      "Local storage is full or unavailable. Export your configuration and remove unused demo records.",
    );
  }
  cached = structuredClone(db);
  rawCache = raw;
  window.dispatchEvent(new Event("mercury:database"));
}
export function readSession(): Session | null {
  try {
    const s = JSON.parse(
      sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SESSION_KEY) ||
        "null",
    );
    if (s?.expiresAt > Date.now()) return s;
  } catch {}
  return null;
}
export function currentUser(db = readDatabase()): User | undefined {
  const session = readSession();
  return db.collections.users.find(
    (u) => u.id === session?.userId && u.status === "active",
  ) as User | undefined;
}
export function can(permission: Permission, db = readDatabase()) {
  const user = currentUser(db);
  const role = db.collections.roles.find((r) => r.id === user?.roleId) as
    Role | undefined;
  return !!role?.permissions.includes(permission);
}
export function assertPermission(permission: Permission, db = readDatabase()) {
  if (!can(permission, db))
    throw new Error("Your role does not have permission to make this change.");
}
export function audit(
  db: Database,
  action: string,
  target: string,
  module: string,
) {
  db.logs.unshift({
    id: crypto.randomUUID(),
    actor: currentUser(db)?.name || "System",
    action,
    target,
    module,
    time: new Date().toISOString(),
  });
  db.logs = db.logs.slice(0, 300);
  db.revision++;
}
export const collectionPermission: Record<Collection, Permission> = {
  products: "products",
  categories: "products",
  media: "media",
  campaigns: "campaigns",
  playlists: "playlists",
  screens: "screens",
  groups: "screens",
  branches: "settings",
  schedules: "schedules",
  announcements: "announcements",
  users: "users",
  roles: "users",
};
export function saveRecord(collection: Collection, value: Entity) {
  const db = readDatabase();
  assertPermission(collectionPermission[collection], db);
  const records = db.collections[collection];
  const previous = records.find((r) => r.id === value.id);
  if (
    ["products", "media", "campaigns", "playlists", "announcements"].includes(
      collection,
    ) &&
    ["published", "live"].includes(value.status) &&
    (!previous || JSON.stringify(previous) !== JSON.stringify(value))
  )
    assertPermission("publish", db);
  if (
    collection === "users" &&
    value.id === "U001" &&
    (value.status !== "active" || value.roleId !== "R001")
  )
    throw new Error("Keep the demo owner active with the Super Admin role.");
  if (
    collection === "roles" &&
    value.id === "R001" &&
    previous &&
    JSON.stringify(previous.permissions) !== JSON.stringify(value.permissions)
  )
    throw new Error(
      "The owner role retains full access. Create a custom role instead.",
    );
  if (previous) {
    db.versions.unshift({
      id: crypto.randomUUID(),
      collection,
      entityId: value.id,
      time: new Date().toISOString(),
      actor: currentUser(db)!.name,
      value: structuredClone(previous),
    });
    db.versions = db.versions.slice(0, 200);
  }
  db.readyRecords ||= {};
  const contentKey = `${collection}:${value.id}`;
  if (
    previous &&
    ["published", "live"].includes(previous.status) &&
    !db.readyRecords[contentKey]
  )
    db.readyRecords[contentKey] = structuredClone(previous);
  const clean = { ...value, updatedAt: new Date().toISOString() };
  if (["published", "live"].includes(clean.status))
    db.readyRecords[contentKey] = structuredClone(clean);
  const i = records.findIndex((r) => r.id === value.id);
  if (i >= 0) records[i] = clean;
  else records.unshift(clean);
  if (collection === "categories" && previous && previous.name !== value.name) {
    db.collections.products.forEach((p) => {
      if (p.category === previous.name) p.category = value.name;
    });
  }
  if (collection === "groups" && Array.isArray(value.screenIds)) {
    for (const item of db.collections.screens as Screen[]) {
      if (value.screenIds.includes(item.id)) {
        item.groupId = value.id;
        if (value.playlist) item.config.playlist = String(value.playlist);
        if (value.theme) item.config.theme = String(value.theme);
      } else if (item.groupId === value.id) item.groupId = "";
    }
  }
  audit(db, previous ? "Saved changes" : "Created", value.name, collection);
  persist(db);
  return clean;
}
