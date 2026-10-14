import { supabase } from "../../utils/supabase/client";
const urls = new Map<string, string>();
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("mercury-assets", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error("Local media storage is unavailable."));
  });
}
export async function storeAsset(file: File): Promise<string> {
  if (supabase) {
    const path = `${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "bin"}`;
    const { error } = await supabase.storage
      .from("signage-media")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("signage-media").getPublicUrl(path).data
      .publicUrl;
  }
  const db = await openDB();
  const id = `asset:${crypto.randomUUID()}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(new Error("Unable to save media. Storage may be full."));
  });
  db.close();
  return id;
}
export async function assetUrl(value: string): Promise<string> {
  if (!value?.startsWith("asset:")) return value;
  if (urls.has(value)) return urls.get(value)!;
  const db = await openDB();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const r = db.transaction("files").objectStore("files").get(value);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.close();
  if (!blob) return "";
  const url = URL.createObjectURL(blob);
  urls.set(value, url);
  return url;
}
export async function hydrateAssets<T>(value: T): Promise<T> {
  if (typeof value === "string") return (await assetUrl(value)) as T;
  if (Array.isArray(value))
    return (await Promise.all(value.map(hydrateAssets))) as T;
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([k, v]) => [k, await hydrateAssets(v)]),
    );
    return Object.fromEntries(entries) as T;
  }
  return value;
}
export async function inspectFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ resolution: string; duration: number }>(
      (resolve, reject) => {
        const node = file.type.startsWith("video/")
          ? document.createElement("video")
          : new Image();
        const timeout = setTimeout(
          () => reject(new Error("Unable to inspect this file.")),
          8000,
        );
        const done = (width: number, height: number, duration: number) => {
          clearTimeout(timeout);
          resolve({ resolution: `${width} × ${height}`, duration });
        };
        if (node instanceof HTMLVideoElement) {
          node.preload = "metadata";
          node.onloadedmetadata = () =>
            done(
              node.videoWidth,
              node.videoHeight,
              Math.round(node.duration) || 12,
            );
        } else
          node.onload = () => done(node.naturalWidth, node.naturalHeight, 12);
        node.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("The file is corrupt or unsupported."));
        };
        node.src = url;
      },
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
