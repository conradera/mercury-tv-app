import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const scheduleService = {
  list: async () => (await adminService.getDatabase()).collections.schedules,
  save: (value: Entity) => adminService.save("schedules", value),
  remove: (ids: string[]) => adminService.remove("schedules", ids),
};
