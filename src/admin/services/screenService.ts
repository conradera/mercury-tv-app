import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const screenService = {
  list: async () => (await adminService.getDatabase()).collections.screens,
  save: (value: Entity) => adminService.save("screens", value),
  remove: (ids: string[]) => adminService.remove("screens", ids),
};
