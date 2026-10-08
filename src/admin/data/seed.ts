import { mockProducts } from "../../data/mockProducts";
import { mockCampaigns } from "../../data/mockCampaigns";
import type {
  Database,
  Entity,
  SignageTheme,
  DisplayLayout,
  PlaylistItem,
} from "../types/models";
const now = new Date().toISOString();
const today = now.slice(0, 10);
const later = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const base = (id: string, name: string, status = "published"): Entity => ({
  id,
  name,
  status,
  updatedAt: now,
});
const palette = {
  primary: "#3159ba",
  secondary: "#506278",
  accent: "#c5ef72",
  background: "#f7f8f6",
  surface: "#101c2c",
  text: "#172334",
  mutedText: "#74808b",
  headerBackground: "#ffffff",
  sidebarBackground: "#ffffff",
  tickerBackground: "#ffffff",
  tickerText: "#172334",
  price: "#172334",
  cta: "#c5ef72",
  success: "#408256",
  warning: "#bf852d",
  error: "#cf5050",
};
export const seedThemes: SignageTheme[] = [
  {
    id: "mercury-classic",
    name: "Mercury Classic",
    colors: { ...palette },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      headingWeight: 750,
      priceWeight: 800,
      scale: "Default",
    },
    borderRadius: "Medium",
    animationStyle: "Crossfade",
    animationSpeed: "Normal",
  },
  ...[
    {
      id: "mercury-dark",
      name: "Mercury Dark",
      colors: {
        background: "#07111f",
        headerBackground: "#101c2c",
        sidebarBackground: "#142235",
        tickerBackground: "#142235",
        text: "#f3f6fb",
        tickerText: "#f3f6fb",
        price: "#c5ef72",
      },
    },
    {
      id: "mercury-executive",
      name: "Mercury Executive",
      colors: {
        accent: "#c7d1df",
        cta: "#c7d1df",
        surface: "#172435",
        background: "#dfe4e9",
      },
    },
    {
      id: "mercury-light",
      name: "Mercury Light",
      colors: {
        background: "#eff4fc",
        accent: "#acd0ff",
        cta: "#acd0ff",
        surface: "#1d3f65",
      },
    },
    {
      id: "high-contrast",
      name: "High Contrast",
      colors: {
        background: "#000000",
        headerBackground: "#000000",
        sidebarBackground: "#000000",
        tickerBackground: "#000000",
        surface: "#000000",
        text: "#ffffff",
        tickerText: "#ffffff",
        price: "#ffff00",
        accent: "#ffff00",
        cta: "#ffff00",
      },
    },
  ].map((t) => ({
    id: t.id,
    name: t.name,
    colors: { ...palette, ...t.colors },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      headingWeight: 750,
      priceWeight: 800,
      scale: "Default",
    },
    borderRadius: "Medium",
    animationStyle: "Crossfade",
    animationSpeed: "Normal",
  })),
];
export const seedLayouts: DisplayLayout[] = [
  "Classic Mercury",
  "Media Focus",
  "Product Focus",
  "Campaign Fullscreen",
  "Split Screen",
  "Minimal",
].map((name, i) => ({
  id: [
    "classic",
    "media-focus",
    "product-focus",
    "campaign-fullscreen",
    "split-screen",
    "minimal",
  ][i],
  name,
  headerEnabled: i !== 3,
  headerHeight: 10.8,
  sidebarEnabled: ![1, 3, 5].includes(i),
  sidebarWidth: i === 2 ? 38 : i === 4 ? 50 : 25,
  tickerEnabled: ![3, 5].includes(i),
  tickerHeight: 16,
  companyInfoEnabled: i !== 3,
  logoSize: 15,
  mediaFit: "cover",
  clockPosition: "right",
  companyInfoPosition: "bottom",
}));
export function createSeed(): Database {
  const products = Array.from({ length: 30 }, (_, i) => {
    const p = mockProducts[i % 20];
    return {
      ...base(
        `P${String(i + 1).padStart(3, "0")}`,
        i < 20 ? p.name : `${p.name} · Business bundle`,
        i === 26 || i === 28 ? "draft" : "published",
      ),
      ...p,
      id: `P${String(i + 1).padStart(3, "0")}`,
      name: i < 20 ? p.name : `${p.name} · Business bundle`,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: p.price || 100000,
      additionalImages: [],
      hidePrice: false,
      sidebarVisible: true,
      tickerVisible: true,
      campaignEligible: true,
      screenIds: [],
      groupIds: [],
      displayDuration: 10,
      displayStart: "",
      displayEnd: "",
    };
  });
  const media = Array.from({ length: 20 }, (_, i) => ({
    ...base(
      `M${String(i + 1).padStart(3, "0")}`,
      i === 0
        ? "Mercury corporate film"
        : i === 1
          ? "Product inspiration · YouTube"
          : `${products[(i + 5) % 30].name} artwork`,
    ),
    type: i === 0 ? "video" : i === 1 ? "youtube" : "image",
    url:
      i === 0
        ? "/videos/mercury-promo.webm"
        : i === 1
          ? "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
          : products[(i + 5) % 30].image,
    thumbnail:
      i === 1
        ? "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"
        : products[(i + 5) % 30].image,
    size: i === 0 ? 1100000 : 160000,
    resolution: i === 0 ? "1280 × 720" : "600 × 600",
    duration: i === 0 ? 8 : i === 1 ? 30 : 12,
    tags: ["Mercury", i % 2 ? "Retail" : "Business"],
    description: "Demo media for showroom use",
    uploadedBy: "Conrad",
    preload: true,
    mute: true,
    autoplay: true,
    startTime: 0,
    endTime: 0,
  }));
  const campaigns = Array.from({ length: 6 }, (_, i) => {
    const c = mockCampaigns[i % 4];
    return {
      ...base(
        `C00${i + 1}`,
        [
          "Powerful possibilities",
          "Back to school",
          "Power your business",
          "Connected & protected",
          "HP Business Week",
          "Weekend essentials",
        ][i],
        ["live", "live", "live", "scheduled", "draft", "paused"][i],
      ),
      description: c.description,
      headline: c.title.replace("\n", " "),
      subheadline: c.accent,
      image: c.image,
      eyebrow: c.eyebrow,
      cta: "Discover more in store",
      background: "#101c2c",
      color: "#ffffff",
      type: "Brand Campaign",
      productIds: [products[i].id],
      mediaIds: [],
      screenIds: ["MERCURY-KLA-001", "MERCURY-KLA-002"],
      groupIds: [],
      duration: 12,
      priority: 5,
      startDate: today,
      endDate: later,
    };
  });
  const items: PlaylistItem[] = [
    {
      id: "item-1",
      type: "campaign",
      refId: "C001",
      title: "Powerful possibilities",
      duration: 12,
      transition: "Crossfade",
      muted: true,
      startTime: 0,
      endTime: 0,
    },
    {
      id: "item-2",
      type: "video",
      refId: "M001",
      title: "Mercury corporate film",
      url: "/videos/mercury-promo.webm",
      duration: 8,
      transition: "Fade",
      muted: true,
      startTime: 0,
      endTime: 0,
    },
    {
      id: "item-3",
      type: "campaign",
      refId: "C002",
      title: "Back to school",
      duration: 12,
      transition: "Crossfade",
      muted: true,
      startTime: 0,
      endTime: 0,
    },
  ];
  const playlists = [
    "Main showroom",
    "Corporate reception",
    "Laptop department",
    "Printer department",
    "Weekend promotions",
  ].map((name, i) => ({
    ...base(
      ["main-showroom", "corporate", "laptops", "printers", "weekend"][i],
      name,
      i === 4 ? "draft" : "published",
    ),
    items: structuredClone(items),
    loop: true,
    shuffle: false,
    fallback: "main-showroom",
    preload: true,
  }));
  const names = [
    "Main showroom TV",
    "Reception display",
    "Laptop section",
    "Printer section TV",
    "Networking display",
    "Counter screen 01",
    "Boardroom display",
    "Service desk TV",
  ];
  const screens = names.map((name, i) => ({
    ...base(
      `MERCURY-KLA-${String(i + 1).padStart(3, "0")}`,
      name,
      [
        "online",
        "online",
        "online",
        "offline",
        "online",
        "syncing",
        "online",
        "offline",
      ][i],
    ),
    branchId: i < 6 ? "B001" : "B002",
    groupId: i < 4 ? "G001" : i < 6 ? "G002" : "G003",
    resolution: i === 0 ? "3840 × 2160" : "1920 × 1080",
    orientation: "Landscape",
    location: i < 4 ? "Ground floor" : "First floor",
    ip: `192.168.1.${101 + i}`,
    lastSeen: new Date(
      Date.now() - (i === 3 || i === 7 ? 18 * 60000 : 10000),
    ).toISOString(),
    pairingPin: String(832741 + i),
    config: {
      screenId: `MERCURY-KLA-${String(i + 1).padStart(3, "0")}`,
      theme: "mercury-dark",
      layout: "classic",
      playlist: i === 1 ? "corporate" : "main-showroom",
      featuredProducts: ["P001", "P002", "P003"],
      tickerProducts: ["P004", "P005", "P006", "P008"],
      settings: {
        showClock: true,
        showPrices: true,
        featuredRotation: 10000,
        tickerRotation: 8000,
        muted: true,
      },
    },
  }));
  const groups = [
    "Main showroom",
    "Retail departments",
    "Corporate offices",
  ].map((name, i) => ({
    ...base(`G00${i + 1}`, name),
    description: "Content and settings shared across this screen group.",
    screenIds: screens
      .filter((s) => s.groupId === `G00${i + 1}`)
      .map((s) => s.id),
    playlist: "main-showroom",
    theme: "mercury-dark",
    schedule: "",
  }));
  const branches = [
    {
      ...base("B001", "Kampala Main"),
      code: "KLA",
      address: "Kampala · demo location",
      phone: "",
      contact: "Conrad",
      timezone: "Africa/Kampala",
    },
    {
      ...base("B002", "Mercury Business Centre"),
      code: "BUS",
      address: "Demo branch",
      phone: "",
      contact: "Sarah",
      timezone: "Africa/Kampala",
    },
  ];
  const schedules = Array.from({ length: 5 }, (_, i) => ({
    ...base(
      `SCH00${i + 1}`,
      [
        "Business hours",
        "Laptop spotlight",
        "Lunchtime offers",
        "Corporate solutions",
        "Weekend highlights",
      ][i],
      "scheduled",
    ),
    type: "playlists",
    contentId: playlists[i].id,
    screenIds: ["MERCURY-KLA-001"],
    groupId: "",
    branchId: "",
    startDate: today,
    endDate: later,
    startTime: ["08:00", "10:00", "12:00", "14:00", "16:00"][i],
    endTime: ["10:00", "12:00", "14:00", "16:00", "18:00"][i],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    repeat: "Weekdays",
    priority: i + 1,
  }));
  const permissions = [
    "products",
    "media",
    "campaigns",
    "playlists",
    "screens",
    "themes",
    "users",
    "publish",
    "analytics",
    "settings",
    "announcements",
    "schedules",
  ];
  const roles = [
    "Super Admin",
    "Marketing Manager",
    "Content Manager",
    "Store Manager",
    "Viewer",
  ].map((name, i) => ({
    ...base(`R00${i + 1}`, name),
    permissions:
      i === 0
        ? permissions
        : i === 1
          ? [
              "products",
              "media",
              "campaigns",
              "playlists",
              "analytics",
              "publish",
              "announcements",
              "schedules",
            ]
          : i === 2
            ? ["products", "media", "campaigns", "playlists"]
            : i === 3
              ? ["screens", "announcements", "schedules"]
              : [],
  }));
  const users = [
    "Conrad Admin",
    "Sarah Namutebi",
    "Daniel Kato",
    "Grace Akello",
    "Alex Viewer",
  ].map((name, i) => ({
    ...base(`U00${i + 1}`, name, "active"),
    email:
      i === 0
        ? "admin@mercury.local"
        : `${name.split(" ")[0].toLowerCase()}@mercury.local`,
    roleId: `R00${i + 1}`,
    lastLogin: new Date(Date.now() - i * 3600000).toISOString(),
  }));
  const logs = Array.from({ length: 15 }, (_, i) => ({
    id: `log-${i}`,
    actor: ["Conrad", "Sarah", "System"][i % 3],
    action: [
      "Updated product",
      "Published campaign",
      "Screen synced",
      "Uploaded media",
      "Assigned playlist",
    ][i % 5],
    target: [
      "HP 15 · Everyday power",
      "Back to school",
      "Main showroom TV",
      "Mercury corporate film",
      "Corporate reception",
    ][i % 5],
    module: ["products", "campaigns", "screens", "media", "playlists"][i % 5],
    time: new Date(Date.now() - i * 17 * 60000).toISOString(),
  }));
  const notifications = Array.from({ length: 8 }, (_, i) => ({
    id: `N00${i + 1}`,
    title: [
      "Printer section TV is offline",
      "Back to school ends soon",
      "New screen connected",
      "Draft content awaits review",
      "Service desk TV is offline",
      "Media ready for review",
      "Playlist updated",
      "Weekly report available",
    ][i],
    description:
      "Demo event · review your display network in the control center.",
    read: i > 2,
    type: i === 0 || i === 4 ? "warning" : "info",
    time: new Date(Date.now() - i * 3600000).toISOString(),
  }));
  return {
    schemaVersion: 1,
    revision: 1,
    collections: {
      products,
      media,
      campaigns,
      playlists,
      screens,
      groups,
      branches,
      schedules,
      users,
      roles,
      categories: [
        "Laptops",
        "Desktops",
        "Printers",
        "Monitors",
        "Networking",
        "Power solutions",
        "Security",
        "Accessories",
        "Software",
        "Storage",
        "Servers",
      ].map((name, i) => ({
        ...base(`CAT${i + 1}`, name, "active"),
        icon: "Monitor",
        color: "#78924f",
        order: i,
      })),
      announcements: [
        {
          ...base("A001", "Welcome to Mercury"),
          message: "Your next upgrade starts here. Speak to our team today.",
          type: "ticker",
          screenIds: [],
          expiresAt: "",
          duration: 30,
          background: "#101c2c",
          color: "#ffffff",
          priority: 1,
        },
      ],
    },
    themes: structuredClone(seedThemes),
    layouts: structuredClone(seedLayouts),
    settings: {
      companyName: "Mercury Computers Limited",
      website: "www.mercurycomputerslimited.com",
      phone: "",
      address: "",
      email: "",
      tagline: "Technology. Business. Connected.",
      timezone: "Africa/Kampala",
      currency: "UGX",
      logo: "/mercury-logo.png",
      lightLogo: "",
      darkLogo: "",
      favicon: "",
      loadingLogo: "",
      featuredRotation: 10000,
      tickerRotation: 8000,
      campaignRotation: 12000,
      showClock: true,
      showPrices: true,
      muted: true,
      preload: true,
      maxImageSize: 10,
      maxVideoSize: 100,
      imageDuration: 12,
      apiBaseUrl: "",
      notificationEmail: false,
      notificationScreens: true,
      autoBackup: false,
      backupFrequency: "Weekly",
    },
    logs,
    notifications,
    versions: [],
    published: {},
  };
}
