import { mockMedia } from "../data/mockMedia";
import { getContent } from "./contentService";
export const getMediaPlaylist = () =>
  getContent("media", "playlist", mockMedia);
