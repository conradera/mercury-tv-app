import { adminService } from "./adminService";
export const analyticsService = {
  async report(days: number) {
    const db = await adminService.getDatabase();
    return {
      products: db.collections.products
        .slice(0, 8)
        .map((p, i) => ({
          name: p.name,
          plays: Math.round(((1248 - i * 119) * days) / 7),
        })),
      screens: db.collections.screens.map((s, i) => ({
        name: s.name,
        uptime: s.status === "offline" ? 89.1 : 99.8 - i * 0.15,
        onlineHours: Math.round(
          days * 24 * (s.status === "offline" ? 0.891 : 0.998),
        ),
        syncFailures: i % 3,
      })),
      daily: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 86400000)
          .toISOString()
          .slice(0, 10),
        plays: 1800 + ((i * 317) % 1300),
      })),
    };
  },
};
