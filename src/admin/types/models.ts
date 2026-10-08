import type {
  SignageTheme,
  DisplayLayout,
  ScreenConfiguration,
  PublishedScreen,
} from "../../types/screenConfig";
export type Permission =
  | "products"
  | "media"
  | "campaigns"
  | "playlists"
  | "screens"
  | "themes"
  | "users"
  | "publish"
  | "analytics"
  | "settings"
  | "announcements"
  | "schedules";
export type Collection =
  | "products"
  | "categories"
  | "media"
  | "campaigns"
  | "playlists"
  | "screens"
  | "groups"
  | "branches"
  | "schedules"
  | "announcements"
  | "users"
  | "roles";
export interface Entity {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  [key: string]: unknown;
}
export interface Product extends Entity {
  category: string;
  brand: string;
  image: string;
  price: number;
  currency: string;
  specifications: string[];
  featured: boolean;
  displayPriority: number;
  availability: string;
}
export interface Category extends Entity {
  icon: string;
  color: string;
  order: number;
}
export interface MediaAsset extends Entity {
  type: "image" | "video" | "youtube";
  url: string;
  thumbnail: string;
  size: number;
  duration: number;
  resolution: string;
  tags: string[];
  uploadedBy: string;
}
export interface Campaign extends Entity {
  headline: string;
  subheadline: string;
  description: string;
  image: string;
  duration: number;
  screenIds: string[];
  priority: number;
}
export interface PlaylistItem {
  playUntilEnd?: boolean;
  id: string;
  type: "youtube" | "video" | "image" | "campaign" | "product";
  title: string;
  refId: string;
  url?: string;
  duration: number;
  transition: string;
  muted: boolean;
  startTime: number;
  endTime: number;
}
export interface Playlist extends Entity {
  items: PlaylistItem[];
  loop: boolean;
  shuffle: boolean;
  fallback: string;
  preload: boolean;
}
export interface Screen extends Entity {
  branchId: string;
  groupId: string;
  resolution: string;
  orientation: string;
  location: string;
  ip: string;
  lastSeen: string;
  pairingPin: string;
  config: ScreenConfiguration;
}
export interface ScreenGroup extends Entity {
  screenIds: string[];
  playlist: string;
  theme: string;
  description: string;
}
export interface Branch extends Entity {
  code: string;
  address: string;
  phone: string;
  contact: string;
  timezone: string;
}
export interface Schedule extends Entity {
  type: string;
  contentId: string;
  screenIds: string[];
  groupId: string;
  branchId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string[];
  repeat: string;
  priority: number;
}
export interface Announcement extends Entity {
  message: string;
  type: string;
  screenIds: string[];
  expiresAt: string;
  duration: number;
  background: string;
  color: string;
  priority: number;
}
export interface User extends Entity {
  email: string;
  roleId: string;
  lastLogin: string;
}
export interface Role extends Entity {
  permissions: Permission[];
}
export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  module: string;
  time: string;
}
export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  type: string;
  time: string;
}
export interface SystemHealth {
  name: string;
  status: string;
  latency: number;
  description: string;
}
export interface Version {
  id: string;
  collection: Collection;
  entityId: string;
  time: string;
  actor: string;
  value: Entity;
}
export interface Settings {
  companyName: string;
  website: string;
  phone: string;
  address: string;
  email: string;
  tagline: string;
  timezone: string;
  currency: string;
  logo: string;
  lightLogo: string;
  darkLogo: string;
  favicon: string;
  loadingLogo: string;
  featuredRotation: number;
  tickerRotation: number;
  campaignRotation: number;
  showClock: boolean;
  showPrices: boolean;
  muted: boolean;
  preload: boolean;
  maxImageSize: number;
  maxVideoSize: number;
  imageDuration: number;
  apiBaseUrl: string;
  notificationEmail: boolean;
  notificationScreens: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  [key: string]: string | number | boolean;
}
export interface Database {
  readyRecords?: Record<string, Entity>;
  schemaVersion: number;
  collections: Record<Collection, Entity[]>;
  themes: SignageTheme[];
  layouts: DisplayLayout[];
  settings: Settings;
  logs: ActivityLog[];
  notifications: Notification[];
  versions: Version[];
  published: Record<string, PublishedScreen>;
  revision: number;
}
export interface Session {
  userId: string;
  expiresAt: number;
}
export type RealtimeEvent = {
  type:
    | "screen.connected"
    | "screen.disconnected"
    | "screen.content_changed"
    | "screen.sync_complete"
    | "campaign.published"
    | "playlist.updated";
  id: string;
  time: string;
};
export type ScreenCommand =
  | "sync"
  | "refresh"
  | "restart"
  | "clear-cache"
  | "screenshot"
  | "mute"
  | "unmute"
  | "pause"
  | "resume"
  | "maintenance"
  | "disable";
export type {
  SignageTheme,
  DisplayLayout,
  ScreenConfiguration,
  PublishedScreen,
};
