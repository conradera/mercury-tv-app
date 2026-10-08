import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminProvider } from "./contexts/AdminContext";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CollectionPage } from "./pages/CollectionPage";
import { PlaylistsPage } from "./pages/PlaylistsPage";
import { ScreensPage } from "./pages/ScreensPage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LayoutsPage } from "./pages/AppearancePage";
import {
  ActivityPage,
  HealthPage,
  AnalyticsPage,
  RolesPage,
  PreviewPage,
  HelpPage,
} from "./pages/OperationsPages";
import "./admin.css";
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15000, refetchOnWindowFocus: false },
  },
});
function AdminRouteError() {
  return (
    <div className="admin-app">
      <div className="admin-loading">
        <h2>This view could not be loaded</h2>
        <p>
          Your saved workspace is still in browser storage. Reload to try again.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Retry
        </button>
        <a href="/admin">Return to overview</a>
      </div>
    </div>
  );
}
const router = createBrowserRouter([
  { path: "/admin/login", element: <LoginPage /> },
  {
    path: "/admin",
    errorElement: <AdminRouteError />,
    element: (
      <AdminProvider>
        <AdminLayout />
      </AdminProvider>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      ...(
        [
          "products",
          "media",
          "campaigns",
          "announcements",
          "groups",
          "branches",
          "users",
          "categories",
        ] as const
      ).map((collection) => ({
        path: collection,
        element: <CollectionPage key={collection} collection={collection} />,
      })),
      { path: "playlists", element: <PlaylistsPage /> },
      { path: "screens", element: <ScreensPage /> },
      { path: "devices", element: <ScreensPage devices /> },
      { path: "layouts", element: <LayoutsPage /> },
      { path: "schedules", element: <SchedulesPage /> },
      { path: "preview", element: <PreviewPage /> },
      { path: "logs", element: <ActivityPage /> },
      { path: "health", element: <HealthPage /> },
      { path: "analytics/content", element: <AnalyticsPage /> },
      { path: "analytics/screens", element: <AnalyticsPage screens /> },
      { path: "roles", element: <RolesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <Navigate to="/admin" replace /> },
    ],
  },
]);
export default function AdminApp() {
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
