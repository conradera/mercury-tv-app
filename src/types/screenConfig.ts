import type { Product } from "./product";
import type { Campaign, Announcement } from "./campaign";
import type { MediaItem } from "./media";
export interface SignageTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    headerBackground: string;
    sidebarBackground: string;
    tickerBackground: string;
    tickerText: string;
    price: string;
    cta: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
    priceWeight: number;
    scale: string;
  };
  borderRadius: string;
  shadowIntensity?: string;
  animationStyle: string;
  animationSpeed: string;
}
export interface DisplayLayout {
  id: string;
  name: string;
  headerEnabled: boolean;
  headerHeight: number;
  sidebarEnabled: boolean;
  sidebarWidth: number;
  tickerEnabled: boolean;
  tickerHeight: number;
  companyInfoEnabled: boolean;
  logoSize: number;
  mediaFit: "cover" | "contain";
  clockPosition: string;
  companyInfoPosition: string;
}
export interface ScreenConfiguration {
  screenId: string;
  theme: string;
  layout: string;
  playlist: string;
  featuredProducts: string[];
  tickerProducts: string[];
  settings: {
    showClock: boolean;
    showPrices: boolean;
    featuredRotation: number;
    tickerRotation: number;
    campaignRotation?: number;
    muted?: boolean;
    paused?: boolean;
    loopPlaylist?: boolean;
    preload?: boolean;
  };
}
export interface PublishedScreen extends ScreenConfiguration {
  version: number;
  publishedAt: string;
  themeData: SignageTheme;
  layoutData: DisplayLayout;
  products: Product[];
  media: MediaItem[];
  campaigns: Campaign[];
  announcements: Announcement[];
  company: {
    name: string;
    website: string;
    phone: string;
    address: string;
    tagline: string;
    logo: string;
    loadingLogo?: string;
    favicon?: string;
    timezone: string;
  };
  emergency?: {
    message: string;
    background: string;
    color: string;
    expiresAt: string;
  };
}
