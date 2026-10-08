import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  ArrowUpRight,
  Radio,
  Command,
  Plus,
  CheckCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "../contexts/AdminContext";
import { navigation } from "./navigation";
import { Modal, Badge, AssetImage } from "./UI";
import { PublishDialog } from "./PublishDialog";
import { authService } from "../services/authService";
import { adminService } from "../services/adminService";
export function AdminLayout() {
  const { db, user, notices, dismiss, run } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [profile, setProfile] = useState(false);
  const [publish, setPublish] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mode, setMode] = useState(
    localStorage.getItem("mercury-admin-theme") || "light",
  );
  const [systemDark, setSystemDark] = useState(
    matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const fn = () => setSystemDark(media.matches);
    media.addEventListener("change", fn);
    return () => media.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  useEffect(() => {
    setMobile(false);
    setProfile(false);
  }, [location.pathname]);
  const title =
    navigation
      .flatMap((g) => g.items)
      .find(
        (n) =>
          "/admin/" + n.path === location.pathname ||
          (!n.path && location.pathname === "/admin"),
      )?.label || "Workspace";
  useEffect(() => {
    document.title = `${title} · Mercury Signage Control`;
  }, [title]);
  const offline = db.collections.screens.filter(
    (s) => s.status === "offline",
  ).length;
  const unread = db.notifications.filter((n) => !n.read).length;
  const commands = [
    { name: "Create product", path: "products?new=1" },
    { name: "Upload media", path: "media?new=1" },
    { name: "Register screen", path: "screens?new=1" },
    { name: "Create campaign", path: "campaigns?new=1" },
    { name: "Open live preview", path: "preview" },
    { name: "Open settings", path: "settings" },
  ];
  const results = Object.entries(db.collections)
    .filter(([k]) =>
      [
        "products",
        "screens",
        "campaigns",
        "playlists",
        "media",
        "users",
      ].includes(k),
    )
    .flatMap(([k, rows]) =>
      rows
        .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
        .map((r) => ({ name: r.name, path: `${k}?edit=${r.id}`, module: k })),
    )
    .slice(0, 12);
  const go = (path: string) => {
    navigate("/admin/" + path);
    setSearchOpen(false);
    setSearch("");
  };
  return (
    <div
      className={`admin-app ${mode === "dark" || (mode === "system" && systemDark) ? "admin-dark" : ""}`}
    >
      <div className="admin-shell">
        <aside className={`admin-sidebar ${mobile ? "open" : ""}`}>
          <Link to="/admin" className="admin-brand">
            <img
              className="admin-mercury-logo"
              src="/mercury-logo.png"
              alt="Mercury Computers"
            />
            <span>
              mercury<small>SIGNAGE CONTROL</small>
            </span>
          </Link>
          <div className="workspace-picker">
            <span className="workspace-avatar">M</span>
            <div>
              Mercury Computers<small>Organization workspace</small>
            </div>
            <ChevronDown size={14} />
          </div>
          <nav>
            {navigation.map((group) => (
              <div className="nav-group" key={group.label}>
                <span>{group.label}</span>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={"/admin" + (item.path ? "/" + item.path : "")}
                    end={!item.path}
                    className={({ isActive }) =>
                      isActive ? "nav-item active" : "nav-item"
                    }
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                    {item.path === "screens" && (
                      <b>{db.collections.screens.length}</b>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span className="environment-dot" />
            LOCAL DEMO WORKSPACE
            <Link to="/admin/help" aria-label="Help center">
              <HelpCircle size={16} />
            </Link>
          </div>
          <button
            className="sidebar-profile"
            onClick={() => setProfile((v) => !v)}
          >
            <span className="avatar">
              {user.name
                .split(" ")
                .map((v) => v[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              {user.name}
              <small>
                {db.collections.roles.find((r) => r.id === user.roleId)?.name}
              </small>
            </span>
            <ChevronDown size={15} />
          </button>
        </aside>
        {mobile && (
          <button
            aria-label="Close navigation"
            className="mobile-scrim"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="admin-workspace">
          <header className="admin-topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <span>/</span>
              <b>{title}</b>
            </div>
            <div className="topbar-right">
              <button
                className="global-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
                <span>Search anything…</span>
                <kbd>⌘ K</kbd>
              </button>
              <Link className="network-indicator" to="/admin/health">
                <i />
                {offline} screens need attention
              </Link>
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                onClick={() => setNotifications(true)}
              >
                <Bell />
                {unread > 0 && <b>{unread}</b>}
              </button>
              <Link to="/admin/help" className="icon-button" aria-label="Help">
                <HelpCircle />
              </Link>
              <button
                className="avatar small-avatar"
                aria-label="Profile menu"
                onClick={() => setProfile((v) => !v)}
              >
                {user.name[0]}
              </button>
            </div>
          </header>
          <main className="admin-main">
            <Outlet context={{ openPublish: () => setPublish(true) }} />
          </main>
          <footer className="admin-footer">
            <span>
              Mercury Digital Signage <i /> Control center
            </span>
            <span>Demo data · Africa/Kampala</span>
          </footer>
        </div>
      </div>
      {profile && (
        <div className="profile-menu popover">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <hr />
          <Link to="/admin/settings?tab=Users%20%26%20Security">
            Profile & security
          </Link>
          <span className="admin-eyebrow">ADMIN APPEARANCE</span>
          <div className="theme-mode-buttons">
            {[
              { id: "light", icon: Sun },
              { id: "dark", icon: Moon },
              { id: "system", icon: Monitor },
            ].map((m) => (
              <button
                aria-label={`${m.id} admin mode`}
                className={mode === m.id ? "active" : ""}
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  localStorage.setItem("mercury-admin-theme", m.id);
                }}
              >
                <m.icon size={16} />
                {m.id}
              </button>
            ))}
          </div>
          <button
            onClick={async () => {
              await authService.logout();
              client.clear();
              navigate("/admin/login");
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
      {searchOpen && (
        <Modal
          title="Search Mercury"
          description="Jump to content, screens, or a quick action."
          onClose={() => setSearchOpen(false)}
        >
          <label className="command-search">
            <Search />
            <input
              autoFocus
              placeholder="Search products, screens, campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>ESC</kbd>
          </label>
          <div className="command-results">
            <span className="admin-eyebrow">QUICK ACTIONS</span>
            {commands
              .filter((c) =>
                c.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((c) => (
                <button key={c.path} onClick={() => go(c.path)}>
                  <Plus size={17} />
                  {c.name}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            {search && (
              <>
                <span className="admin-eyebrow">WORKSPACE RESULTS</span>
                {results.map((r) => (
                  <button key={r.path} onClick={() => go(r.path)}>
                    <Command size={16} />
                    <span>
                      {r.name}
                      <small>{r.module}</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                ))}
                {!results.length && <p>No matching content.</p>}
              </>
            )}
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal
          title="Notifications"
          description={`${unread} unread updates in your workspace`}
          onClose={() => setNotifications(false)}
        >
          <div className="notification-actions">
            <button
              className="text-button"
              onClick={() =>
                run(
                  () =>
                    adminService.readNotifications(
                      db.notifications.map((n) => n.id),
                    ),
                  "All notifications marked read",
                )
              }
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>
          <div className="notification-list">
            {db.notifications.map((n) => (
              <button
                key={n.id}
                className={n.read ? "read" : ""}
                onClick={() =>
                  run(() => adminService.readNotifications([n.id]))
                }
              >
                <span className="notification-icon">
                  <Bell size={17} />
                </span>
                <span>
                  <b>{n.title}</b>
                  <small>{n.description}</small>
                  <time>{new Date(n.time).toLocaleString()}</time>
                </span>
                {!n.read && <i />}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {publish && <PublishDialog onClose={() => setPublish(false)} />}
      <div className="toast-stack" aria-live="polite">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`toast ${n.error ? "error" : ""}`}
            role={n.error ? "alert" : "status"}
          >
            <span>{n.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => dismiss(n.id)}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
