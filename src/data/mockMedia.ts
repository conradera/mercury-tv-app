import type { MediaItem } from "../types/media";
// Demo playlist. Replace video URLs with your licensed campaign assets.
export const mockMedia: MediaItem[] = [
  {
    id: "brand",
    type: "campaign",
    campaignId: "business",
    title: "Powerful possibilities",
  },
  {
    id: "school",
    type: "campaign",
    campaignId: "back-to-school",
    title: "Power up your semester",
  },
  {
    id: "youtube-demo",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    duration: 30,
    title: "Big Buck Bunny · sample video",
  },
  {
    id: "power",
    type: "campaign",
    campaignId: "power",
    title: "Power your business",
  },
  {
    id: "custom-demo",
    type: "video",
    url: "/videos/mercury-promo.webm",
    duration: 25,
    title: "Mercury promotional film",
    fit: "cover",
  },
  {
    id: "security",
    type: "campaign",
    campaignId: "security",
    title: "Connected and protected",
  },
];
