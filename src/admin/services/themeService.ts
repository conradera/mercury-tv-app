import { adminService } from "./adminService";
export const themeService = {
  list: async () => (await adminService.getDatabase()).themes,
  save: adminService.saveTheme,
  apply: adminService.publish,
};
