import { adminService } from "./adminService";
import type { Entity } from "../types/models";
export const productService = {
  list: async () => (await adminService.getDatabase()).collections.products,
  save: (value: Entity) => adminService.save("products", value),
  remove: (ids: string[]) => adminService.remove("products", ids),
};
