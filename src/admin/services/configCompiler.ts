import type {
  Database,
  Screen,
  Playlist,
  Campaign,
  MediaAsset,
  PublishedScreen,
  Product,
  Announcement,
  Collection,
  Entity,
} from "../types/models";
import type { MediaItem } from "../../types/media";
import type { Campaign as TVCampaign } from "../../types/campaign";
import type { Product as TVProduct } from "../../types/product";
export function compileScreen(
  source: Database,
  screen: Screen,
  includeDrafts = false,
): PublishedScreen {
  // Re-publishing unrelated changes must not leak or remove unfinished edits.
  const ready = (collection: Collection): Entity[] =>
    source.collections[collection].flatMap((record) => {
      if (record.status !== "draft") return [record];
      if (includeDrafts)
        return [
          {
            ...record,
            status: collection === "campaigns" ? "live" : "published",
          },
        ];
      const previous =
        source.readyRecords?.[`${collection}:${record.id}`] ||
        source.versions.find(
          (v) =>
            v.collection === collection &&
            v.entityId === record.id &&
            ["published", "live"].includes(v.value.status),
        )?.value;
      return previous ? [previous] : [];
    });
  const db: Database = {
    ...source,
    collections: {
      ...source.collections,
      products: ready("products"),
      media: ready("media"),
      campaigns: ready("campaigns"),
      playlists: ready("playlists"),
      announcements: ready("announcements"),
    },
  };
  const config = screen.config;
  const assigned = db.collections.products.filter(
    (p) =>
      p.status === "published" &&
      (!Array.isArray(p.screenIds) ||
        !p.screenIds.length ||
        p.screenIds.includes(screen.id)) &&
      (!Array.isArray(p.groupIds) ||
        !p.groupIds.length ||
        p.groupIds.includes(screen.groupId)),
  ) as Product[];
  const products: TVProduct[] = assigned.map((p) => ({
    ...p,
    price: p.hidePrice ? undefined : Number(p.price),
    promotionalPrice: p.hidePrice
      ? undefined
      : Number(p.promotionalPrice) || undefined,
    availability:
      p.availability === "limited"
        ? "limited"
        : p.availability === "out_of_stock"
          ? "out_of_stock"
          : p.availability === "coming_soon"
            ? "coming_soon"
            : "in_stock",
  }));
  const campaigns: TVCampaign[] = (db.collections.campaigns as Campaign[])
    .filter((c) => c.status === "live" || c.status === "published")
    .map((c) => ({
      id: c.id,
      eyebrow: String(c.eyebrow || "MERCURY COMPUTERS"),
      title: c.headline,
      accent: c.subheadline,
      description: c.description,
      image: c.image,
      tags: ["Genuine products", "Expert advice", "Available in store"],
      cta: String(c.cta || "Discover more in store"),
      background: String(c.background || ""),
      color: String(c.color || ""),
    }));
  let list = db.collections.playlists.find((p) => p.id === config.playlist) as
    Playlist | undefined;
  if (list && !list.items.length && list.fallback !== list.id)
    list = db.collections.playlists.find((p) => p.id === list!.fallback) as
      Playlist | undefined;
  const orderedItems = [...(list?.items || [])];
  if (list?.shuffle)
    for (let i = orderedItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedItems[i], orderedItems[j]] = [orderedItems[j], orderedItems[i]];
    }
  const media: MediaItem[] = [];
  for (const item of orderedItems) {
    if (item.type === "campaign") {
      if (campaigns.some((c) => c.id === item.refId))
        media.push({
          id: item.id,
          type: "campaign",
          title: item.title,
          campaignId: item.refId,
          duration: item.duration,
        });
    } else if (item.type === "product") {
      const p = products.find((p) => p.id === item.refId);
      if (p) {
        campaigns.push({
          id: item.id,
          eyebrow: p.category,
          title: p.name,
          accent: "Available at Mercury.",
          description: p.specifications?.join(" • ") || "",
          image: p.image,
          tags: ["Genuine products", "Expert advice"],
        });
        media.push({
          id: item.id,
          type: "campaign",
          title: p.name,
          campaignId: item.id,
          duration: item.duration,
        });
      }
    } else {
      const asset = db.collections.media.find((m) => m.id === item.refId) as
        MediaAsset | undefined;
      if (item.refId && (!asset || asset.status !== "published")) continue;
      if (!asset && item.type !== "youtube") continue;
      const url = asset?.url || item.url;
      if (!url) continue;
      if (item.type === "image") {
        campaigns.push({
          id: item.id,
          eyebrow: "THE MERCURY EDIT",
          title: item.title,
          accent: "",
          description: (asset?.description as string) || "",
          image: url,
          tags: [],
        });
        media.push({
          id: item.id,
          type: "campaign",
          title: item.title,
          campaignId: item.id,
          duration: item.duration,
        });
      } else
        media.push({
          id: item.id,
          type: item.type,
          title: item.title,
          url,
          duration: item.duration,
          playUntilEnd:
            item.type === "youtube"
              ? item.playUntilEnd !== false
              : item.playUntilEnd,
          startTime: item.startTime,
          endTime: item.endTime,
          muted: item.muted,
        });
    }
  }
  const announcements = (db.collections.announcements as Announcement[]).filter(
    (a) =>
      a.status === "published" &&
      (!a.screenIds.length || a.screenIds.includes(screen.id)) &&
      (!a.expiresAt || new Date(a.expiresAt).getTime() > Date.now()),
  );
  const emergency = announcements
    .filter((a) => a.type === "emergency")
    .sort((a, b) => b.priority - a.priority)[0];
  return {
    ...structuredClone(config),
    settings: {
      ...config.settings,
      campaignRotation: db.settings.campaignRotation,
      loopPlaylist: list?.loop ?? true,
      preload: list?.preload ?? true,
    },
    featuredProducts: config.featuredProducts.filter((id) =>
      products.some((p) => p.id === id && p.sidebarVisible !== false),
    ),
    tickerProducts: config.tickerProducts.filter((id) =>
      products.some((p) => p.id === id && p.tickerVisible !== false),
    ),
    version: (db.published[screen.id]?.version || 0) + 1,
    publishedAt: new Date().toISOString(),
    themeData: structuredClone(
      db.themes.find((t) => t.id === config.theme) || db.themes[0],
    ),
    layoutData: structuredClone(
      db.layouts.find((l) => l.id === config.layout) || db.layouts[0],
    ),
    products,
    media,
    campaigns,
    announcements: announcements
      .filter((a) => a.type !== "emergency")
      .map((a) => ({
        id: a.id,
        text: a.message,
        type: a.type,
        duration: a.duration,
        background: a.background,
        color: a.color,
        expiresAt: a.expiresAt,
      })),
    company: {
      name: db.settings.companyName,
      website: db.settings.website,
      phone: db.settings.phone,
      address: db.settings.address,
      tagline: db.settings.tagline,
      logo: db.settings.logo,
      loadingLogo: db.settings.loadingLogo,
      favicon: db.settings.favicon,
      timezone: db.settings.timezone,
    },
    emergency: emergency
      ? {
          message: emergency.message,
          background: emergency.background,
          color: emergency.color,
          expiresAt:
            emergency.expiresAt ||
            new Date(Date.now() + emergency.duration * 1000).toISOString(),
        }
      : undefined,
  };
}
