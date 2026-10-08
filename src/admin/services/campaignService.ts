import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const campaignService = {
  list: async () => (await adminService.getDatabase()).collections.campaigns,
  save: (value: Entity) => adminService.save("campaigns", value),
  remove: (ids: string[]) => adminService.remove("campaigns", ids),
};
