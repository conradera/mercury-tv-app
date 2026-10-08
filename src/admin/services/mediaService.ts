import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const mediaService = {
  list: async () => (await adminService.getDatabase()).collections.media,
  save: (value: Entity) => adminService.save("media", value),
  remove: (ids: string[]) => adminService.remove("media", ids),
};
