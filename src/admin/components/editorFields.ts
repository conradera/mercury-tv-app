import type { Collection, Database, Entity } from "../types/models";
export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "checkbox"
    | "multiselect"
    | "image"
    | "date"
    | "datetime-local"
    | "time"
    | "color"
    | "specs";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  hint?: string;
}
export interface Section {
  title: string;
  fields: Field[];
}
const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
export function editorSections(
  collection: Collection,
  db: Database,
): Section[] {
  const records = (key: Collection) =>
    db.collections[key].map((r) => ({ value: r.id, label: r.name }));
  const assignment: Field[] = [
    {
      key: "screenIds",
      label: "Assigned screens",
      type: "multiselect",
      options: records("screens"),
    },
    {
      key: "groupIds",
      label: "Assigned screen groups",
      type: "multiselect",
      options: records("groups"),
    },
  ];
  const dates: Field[] = [
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
  ];
  const common: Field[] = [
    { key: "name", label: collection === "screens" ? "Screen name" : "Name" },
    { key: "id", label: collection === "products" ? "Product ID / SKU" : "ID" },
  ];
  if (collection === "products")
    return [
      {
        title: "Basic information",
        fields: [
          ...common,
          { key: "slug", label: "Slug" },
          { key: "brand", label: "Brand" },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: db.collections.categories
              .filter((c) => c.status === "active")
              .map((c) => ({ value: c.name, label: c.name })),
          },
        ],
      },
      {
        title: "Product imagery",
        fields: [
          { key: "image", label: "Main product image", type: "image" },
          {
            key: "additionalImages",
            label: "Additional image URLs",
            type: "specs",
          },
        ],
      },
      {
        title: "Pricing & availability",
        fields: [
          { key: "price", label: "Regular price", type: "number", min: 0 },
          {
            key: "promotionalPrice",
            label: "Promotional price",
            type: "number",
            min: 0,
          },
          {
            key: "currency",
            label: "Currency",
            type: "select",
            options: options(["UGX", "USD", "KES"]),
          },
          {
            key: "availability",
            label: "Availability",
            type: "select",
            options: options([
              "in_stock",
              "limited",
              "out_of_stock",
              "coming_soon",
            ]),
          },
          {
            key: "hidePrice",
            label: "Hide price on signage",
            type: "checkbox",
          },
        ],
      },
      {
        title: "Specifications",
        fields: [
          { key: "specifications", label: "Key specifications", type: "specs" },
        ],
      },
      {
        title: "Promotion & display",
        fields: [
          {
            key: "promotionLabel",
            label: "Promotion badge",
            type: "select",
            options: options([
              "NEW ARRIVAL",
              "HOT DEAL",
              "LIMITED OFFER",
              "BEST SELLER",
              "DISCOUNT",
              "CUSTOM",
            ]),
          },
          { key: "customPromotionLabel", label: "Custom promotion label" },
          { key: "featured", label: "Featured product", type: "checkbox" },
          {
            key: "displayPriority",
            label: "Priority (1–10)",
            type: "number",
            min: 1,
            max: 10,
          },
          {
            key: "sidebarVisible",
            label: "Sidebar visibility",
            type: "checkbox",
          },
          {
            key: "tickerVisible",
            label: "Bottom ticker visibility",
            type: "checkbox",
          },
          {
            key: "campaignEligible",
            label: "Main campaign eligible",
            type: "checkbox",
          },
          {
            key: "displayDuration",
            label: "Display duration (seconds)",
            type: "number",
            min: 1,
          },
          {
            key: "displayStart",
            label: "Display start",
            type: "datetime-local",
          },
          { key: "displayEnd", label: "Display end", type: "datetime-local" },
          ...assignment,
        ],
      },
    ];
  if (collection === "media")
    return [
      {
        title: "Asset details",
        fields: [
          ...common,
          {
            key: "type",
            label: "Media type",
            type: "select",
            options: options(["image", "video", "youtube"]),
          },
          {
            key: "url",
            label: "Media URL or YouTube link",
            hint: "YouTube links are validated and their thumbnail is extracted.",
          },
          { key: "image", label: "Upload image or video", type: "image" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "tags", label: "Tags", type: "specs" },
        ],
      },
      {
        title: "Playback",
        fields: [
          {
            key: "duration",
            label: "Duration (seconds)",
            type: "number",
            min: 1,
          },
          {
            key: "startTime",
            label: "Start time (seconds)",
            type: "number",
            min: 0,
          },
          {
            key: "endTime",
            label: "End time (seconds, 0 = end)",
            type: "number",
            min: 0,
          },
          { key: "mute", label: "Mute by default", type: "checkbox" },
          { key: "autoplay", label: "Autoplay", type: "checkbox" },
          { key: "preload", label: "Preload on screens", type: "checkbox" },
        ],
      },
    ];
  if (collection === "campaigns")
    return [
      {
        title: "Campaign information",
        fields: [
          ...common,
          { key: "description", label: "Description", type: "textarea" },
          {
            key: "type",
            label: "Campaign type",
            type: "select",
            options: options([
              "Product Promotion",
              "Brand Campaign",
              "Service Campaign",
              "Announcement",
              "Seasonal Promotion",
              "Custom",
            ]),
          },
        ],
      },
      {
        title: "Creative",
        fields: [
          { key: "eyebrow", label: "Eyebrow" },
          { key: "headline", label: "Headline" },
          { key: "subheadline", label: "Accent headline" },
          { key: "cta", label: "Call to action" },
          { key: "image", label: "Campaign artwork", type: "image" },
          { key: "background", label: "Background / overlay", type: "color" },
          { key: "color", label: "Text color", type: "color" },
        ],
      },
      {
        title: "Content & schedule",
        fields: [
          {
            key: "productIds",
            label: "Assigned products",
            type: "multiselect",
            options: records("products"),
          },
          {
            key: "mediaIds",
            label: "Assigned media",
            type: "multiselect",
            options: records("media"),
          },
          {
            key: "duration",
            label: "Duration (seconds)",
            type: "number",
            min: 1,
          },
          {
            key: "priority",
            label: "Priority",
            type: "number",
            min: 1,
            max: 10,
          },
          ...dates,
          ...assignment,
        ],
      },
    ];
  if (collection === "screens")
    return [
      {
        title: "1 · Screen identity",
        fields: [
          ...common,
          {
            key: "pairingPin",
            label: "Pairing PIN (simulated)",
            hint: "Six digits. A real device handshake needs the future backend.",
          },
          { key: "location", label: "Location description" },
          {
            key: "branchId",
            label: "Branch",
            type: "select",
            options: records("branches"),
          },
          {
            key: "groupId",
            label: "Screen group",
            type: "select",
            options: records("groups"),
          },
        ],
      },
      {
        title: "2 · Display & content",
        fields: [
          {
            key: "resolution",
            label: "Resolution",
            type: "select",
            options: options([
              "1920 × 1080",
              "2560 × 1440",
              "3840 × 2160",
              "Automatic",
            ]),
          },
          {
            key: "orientation",
            label: "Orientation",
            type: "select",
            options: options(["Landscape", "Portrait"]),
          },
          {
            key: "playlist",
            label: "Playlist",
            type: "select",
            options: records("playlists"),
          },
          {
            key: "theme",
            label: "Theme",
            type: "select",
            options: db.themes.map((t) => ({ value: t.id, label: t.name })),
          },
        ],
      },
    ];
  if (collection === "groups")
    return [
      {
        title: "Group settings",
        fields: [
          ...common,
          { key: "description", label: "Description", type: "textarea" },
          {
            key: "screenIds",
            label: "Screens",
            type: "multiselect",
            options: records("screens"),
          },
          {
            key: "playlist",
            label: "Default playlist",
            type: "select",
            options: records("playlists"),
          },
          {
            key: "theme",
            label: "Default theme",
            type: "select",
            options: db.themes.map((t) => ({ value: t.id, label: t.name })),
          },
          {
            key: "schedule",
            label: "Schedule",
            type: "select",
            options: [
              { value: "", label: "No default schedule" },
              ...records("schedules"),
            ],
          },
        ],
      },
    ];
  if (collection === "branches")
    return [
      {
        title: "Branch details",
        fields: [
          ...common,
          { key: "code", label: "Branch code" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "phone", label: "Phone" },
          { key: "contact", label: "Contact person" },
          {
            key: "timezone",
            label: "Timezone",
            type: "select",
            options: options([
              "Africa/Kampala",
              "Africa/Nairobi",
              "Africa/Kigali",
              "UTC",
            ]),
          },
        ],
      },
    ];
  if (collection === "schedules")
    return [
      {
        title: "Schedule content",
        fields: [
          ...common,
          {
            key: "type",
            label: "Content type",
            type: "select",
            options: options([
              "playlists",
              "campaigns",
              "products",
              "announcements",
              "themes",
            ]),
          },
          {
            key: "contentId",
            label: "Content",
            type: "select",
            options: [
              ...records("playlists"),
              ...records("campaigns"),
              ...records("products"),
              ...records("announcements"),
              ...db.themes.map((t) => ({ value: t.id, label: t.name })),
            ],
          },
        ],
      },
      {
        title: "Timing",
        fields: [
          ...dates,
          { key: "startTime", label: "Start time", type: "time" },
          { key: "endTime", label: "End time", type: "time" },
          {
            key: "repeat",
            label: "Repeat",
            type: "select",
            options: options([
              "Never",
              "Daily",
              "Weekdays",
              "Weekends",
              "Weekly",
              "Custom",
            ]),
          },
          {
            key: "days",
            label: "Days",
            type: "multiselect",
            options: options(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
          },
          {
            key: "priority",
            label: "Priority",
            type: "number",
            min: 1,
            max: 10,
          },
        ],
      },
      {
        title: "Target displays",
        fields: [
          ...assignment,
          {
            key: "branchId",
            label: "Branch",
            type: "select",
            options: [
              { value: "", label: "All branches" },
              ...records("branches"),
            ],
          },
        ],
      },
    ];
  if (collection === "announcements")
    return [
      {
        title: "Announcement",
        fields: [
          ...common,
          { key: "message", label: "Message", type: "textarea" },
          {
            key: "type",
            label: "Display type",
            type: "select",
            options: options(["ticker", "banner", "fullscreen", "emergency"]),
          },
          { key: "background", label: "Background color", type: "color" },
          { key: "color", label: "Text color", type: "color" },
          {
            key: "duration",
            label: "Duration (seconds)",
            type: "number",
            min: 1,
          },
          {
            key: "expiresAt",
            label: "Expiration time",
            type: "datetime-local",
          },
          {
            key: "priority",
            label: "Priority",
            type: "number",
            min: 1,
            max: 10,
          },
          ...assignment,
        ],
      },
    ];
  if (collection === "users")
    return [
      {
        title: "User information",
        fields: [
          ...common,
          { key: "email", label: "Email address" },
          {
            key: "roleId",
            label: "Role",
            type: "select",
            options: records("roles"),
          },
          {
            key: "status",
            label: "Account status",
            type: "select",
            options: options(["active", "disabled"]),
          },
        ],
      },
    ];
  if (collection === "roles")
    return [
      {
        title: "Role",
        fields: [
          ...common,
          {
            key: "permissions",
            label: "Permissions",
            type: "multiselect",
            options: options([
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
            ]),
          },
        ],
      },
    ];
  if (collection === "categories")
    return [
      {
        title: "Category",
        fields: [
          ...common,
          {
            key: "icon",
            label: "Icon",
            type: "select",
            options: options([
              "Monitor",
              "Laptop",
              "Printer",
              "Shield",
              "Wifi",
              "Package",
            ]),
          },
          { key: "color", label: "Label color", type: "color" },
          { key: "order", label: "Display order", type: "number", min: 0 },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: options(["active", "disabled"]),
          },
        ],
      },
    ];
  return [{ title: "Details", fields: common }];
}
export function newEntity(collection: Collection, db: Database): Entity {
  const id =
    collection === "screens"
      ? `MERCURY-KLA-${String(Math.max(0, ...db.collections.screens.map((s) => Number(s.id.split("-").pop()) || 0)) + 1).padStart(3, "0")}`
      : `${collection.slice(0, 1).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
  return {
    id,
    name: "",
    status: ["users", "categories"].includes(collection)
      ? "active"
      : collection === "screens"
        ? "syncing"
        : collection === "schedules"
          ? "scheduled"
          : "draft",
    updatedAt: new Date().toISOString(),
    category: "Laptops",
    brand: "HP",
    image: "",
    price: 0,
    currency: "UGX",
    availability: "in_stock",
    specifications: [],
    additionalImages: [],
    featured: false,
    displayPriority: 5,
    promotionLabel: "NEW ARRIVAL",
    sidebarVisible: true,
    tickerVisible: true,
    campaignEligible: true,
    hidePrice: false,
    screenIds: [],
    groupIds: [],
    productIds: [],
    mediaIds: [],
    tags: [],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    duration: 12,
    displayDuration: 10,
    priority: 5,
    background: "#101c2c",
    color: "#ffffff",
    type:
      collection === "media"
        ? "image"
        : collection === "announcements"
          ? "ticker"
          : collection === "schedules"
            ? "playlists"
            : "Brand Campaign",
    mute: true,
    autoplay: true,
    preload: true,
    startTime: collection === "schedules" ? "08:00" : 0,
    endTime: collection === "schedules" ? "18:00" : 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    repeat: "Weekdays",
    branchId: db.collections.branches[0]?.id || "",
    groupId: db.collections.groups[0]?.id || "",
    resolution: "1920 × 1080",
    orientation: "Landscape",
    pairingPin: String(Math.floor(100000 + Math.random() * 900000)),
    playlist: "main-showroom",
    theme: "mercury-dark",
    roleId: "R005",
    timezone: "Africa/Kampala",
    permissions: [],
    order: db.collections.categories.length,
    icon: "Monitor",
    items: [],
    loop: true,
    shuffle: false,
    fallback: "main-showroom",
  };
}
