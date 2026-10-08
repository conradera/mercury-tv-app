import { mockCampaigns, mockAnnouncements } from "../data/mockCampaigns";
import { getContent } from "./contentService";
export const getCampaigns = () =>
  getContent("campaigns", "campaigns", mockCampaigns);
export const getAnnouncements = () =>
  getContent("announcements", "announcements", mockAnnouncements);
