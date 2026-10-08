import {
  LayoutDashboard,
  Package,
  Images,
  Megaphone,
  ListVideo,
  BellRing,
  Monitor,
  Layers,
  PanelsTopLeft,
  CalendarDays,
  Eye,
  Building2,
  Cpu,
  History,
  Activity,
  BarChart3,
  PieChart,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react";
export const navigation = [
  {
    label: "WORKSPACE",
    items: [{ path: "", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "CONTENT",
    items: [
      { path: "products", label: "Products", icon: Package },
      { path: "media", label: "Media library", icon: Images },
      { path: "campaigns", label: "Campaigns", icon: Megaphone },
      { path: "playlists", label: "Playlists", icon: ListVideo },
      { path: "announcements", label: "Announcements", icon: BellRing },
    ],
  },
  {
    label: "DISPLAY MANAGEMENT",
    items: [
      { path: "screens", label: "Screens", icon: Monitor },
      { path: "groups", label: "Screen groups", icon: Layers },
      { path: "layouts", label: "Layouts", icon: PanelsTopLeft },
      { path: "schedules", label: "Schedules", icon: CalendarDays },
      { path: "preview", label: "Live preview", icon: Eye },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { path: "branches", label: "Branches", icon: Building2 },
      { path: "devices", label: "Devices", icon: Cpu },
      { path: "logs", label: "Activity logs", icon: History },
      { path: "health", label: "System health", icon: Activity },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      {
        path: "analytics/content",
        label: "Content analytics",
        icon: BarChart3,
      },
      { path: "analytics/screens", label: "Screen analytics", icon: PieChart },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      { path: "users", label: "Users", icon: Users },
      { path: "roles", label: "Roles & permissions", icon: ShieldCheck },
      { path: "settings", label: "Settings", icon: Settings },
    ],
  },
];
