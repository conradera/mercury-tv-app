import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const userService = {
  list: async () => (await adminService.getDatabase()).collections.users,
  save: (value: Entity) => adminService.save("users", value),
  remove: (ids: string[]) => adminService.remove("users", ids),
};
