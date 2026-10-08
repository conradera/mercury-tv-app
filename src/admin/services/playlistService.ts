import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const playlistService = {
  list: async () => (await adminService.getDatabase()).collections.playlists,
  save: (value: Entity) => adminService.save("playlists", value),
  remove: (ids: string[]) => adminService.remove("playlists", ids),
};
