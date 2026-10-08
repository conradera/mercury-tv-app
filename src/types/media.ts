export interface MediaItem {
  playUntilEnd?: boolean;
  id: string;
  title: string;
  type: "youtube" | "video" | "campaign";
  url?: string;
  campaignId?: string;
  duration?: number;
  fit?: "cover" | "contain";
  startTime?: number;
  endTime?: number;
  muted?: boolean;
}
