import { adminService } from "./adminService";
export const settingsService = {
  get: async () => (await adminService.getDatabase()).settings,
  save: adminService.saveSettings,
};
