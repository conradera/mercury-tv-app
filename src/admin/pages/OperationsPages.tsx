import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Download,
  Printer,
  Monitor,
  Clock3,
  Play,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Server,
  Database,
  Cloud,
  Radio,
  ArrowUpRight,
  BookOpen,
  Search,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import {
  PageHeading,
  DataTable,
  Badge,
  StatCard,
  Empty,
} from "../components/UI";
import { EntityEditor } from "../components/EntityEditor";
import { newEntity } from "../components/editorFields";
import { ScreenPreview } from "../components/ScreenPreview";
import { adminService } from "../services/adminService";
import { analyticsService } from "../services/analyticsService";
import { exportCSV } from "../utils/export";
import type { Entity, Role, Permission, Screen } from "../types/models";
export function ActivityPage() {
  const { db } = useAdmin();
  const [module, setModule] = useState("all");
  const [actor, setActor] = useState("all");
  const [date, setDate] = useState("");
  const rows = db.logs
    .filter(
      (l) =>
        (module === "all" || l.module === module) &&
        (actor === "all" || l.actor === actor) &&
        (!date || l.time.startsWith(date)),
    )
    .map((l) => ({
      ...l,
      name: l.target,
      status: l.action,
      updatedAt: l.time,
    }));
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE AUDIT TRAIL"
        title="Activity logs"
        description="Every change, with the context you need."
        actions={
          <button
            className="btn"
            onClick={() => exportCSV(rows, "mercury-activity.csv")}
          >
            <Download size={15} />
            Export log
          </button>
        }
      />
      <DataTable
        rows={rows}
        searchPlaceholder="Search activity…"
        filters={
          <>
            <select
              aria-label="Filter activity module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="all">All modules</option>
              {[...new Set(db.logs.map((l) => l.module))].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Filter actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            >
              <option value="all">All users</option>
              {[...new Set(db.logs.map((l) => l.actor))].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <input
              aria-label="Filter activity date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </>
        }
        columns={[
          {
            key: "action",
            label: "Action",
            render: (r) => (
              <span className="log-action">
                <Activity size={16} />
                {String(r.action)}
              </span>
            ),
          },
          { key: "target", label: "Content" },
          { key: "actor", label: "User" },
          {
            key: "module",
            label: "Module",
            render: (r) => <Badge>{String(r.module)}</Badge>,
          },
          {
            key: "time",
            label: "Date & time",
            render: (r) => new Date(String(r.time)).toLocaleString(),
          },
        ]}
      />
    </>
  );
}
export function HealthPage() {
  const { db, run, can } = useAdmin();
  const [checked, setChecked] = useState(new Date());
  const items = [
    {
      name: "API adapter",
      status: "Mock connected",
      icon: Server,
      description: "Browser-local service adapter",
    },
    {
      name: "Database",
      status: "Local storage",
      icon: Database,
      description: "Draft records and published snapshots",
    },
    {
      name: "Media storage",
      status: "IndexedDB",
      icon: Cloud,
      description: "Uploads remain in this browser",
    },
    {
      name: "Screen connection",
      status: "Simulated",
      icon: Radio,
      description: "No remote device service connected",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="NETWORK OPERATIONS"
        title="System health"
        description="A clear view of the services behind your signage network."
        actions={
          <button className="btn" onClick={() => setChecked(new Date())}>
            Refresh status
          </button>
        }
      />
      <div className="health-banner">
        <CheckCircle2 />
        <div>
          <h2>Local workspace is operational</h2>
          <p>
            Backend services and remote device telemetry are not connected in
            this demo.
          </p>
        </div>
        <Badge>demo environment</Badge>
      </div>
      <div className="health-grid">
        {items.map((s) => (
          <section className="panel health-card" key={s.name}>
            <s.icon />
            <h3>{s.name}</h3>
            <Badge>{s.status}</Badge>
            <p>{s.description}</p>
            <small>Checked {checked.toLocaleTimeString()}</small>
          </section>
        ))}
      </div>
      <div className="panel health-table">
        <h2>Screen connectivity</h2>
        {db.collections.screens.map((s) => (
          <div key={s.id}>
            <span>
              <Monitor size={17} />
              <b>{s.name}</b>
            </span>
            <Badge>{s.status}</Badge>
            {import.meta.env.DEV && (
              <button
                className="btn small"
                disabled={!can("screens")}
                onClick={() =>
                  run(
                    () =>
                      adminService.save("screens", {
                        ...s,
                        status: s.status === "online" ? "offline" : "online",
                      }),
                    "Screen status simulated",
                  )
                }
              >
                Simulate {s.status === "online" ? "offline" : "online"}
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="secondary-metrics">
        <span>
          Last update <b>{checked.toLocaleTimeString()}</b>
        </span>
        <span>
          Pending drafts{" "}
          <b>
            {
              Object.values(db.collections)
                .flat()
                .filter((r) => r.status === "draft").length
            }
          </b>
        </span>
        <span>
          Remote requests <b>Not connected</b>
        </span>
      </div>
    </>
  );
}
export function AnalyticsPage({ screens = false }: { screens?: boolean }) {
  const { can } = useAdmin();
  const [days, setDays] = useState(7);
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  );
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const effectiveDays = custom
    ? Math.min(
        90,
        Math.max(
          1,
          Math.ceil(
            (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
          ) + 1,
        ),
      )
    : days;
  const query = useQuery({
    queryKey: ["analytics", effectiveDays],
    queryFn: () => analyticsService.report(effectiveDays),
  });
  if (!can("analytics"))
    return (
      <Empty
        title="Analytics access required"
        description="Ask an administrator to grant View Analytics permission."
      />
    );
  if (!query.data) return <div className="panel skeleton analytics-skeleton" />;
  const report = query.data;
  const total = report.daily.reduce((n, d) => n + d.plays, 0);
  const rows = (screens ? report.screens : report.products).map((r, i) => ({
    ...r,
    id: String(i),
    status: "demo",
    updatedAt: "",
  }));
  const max = Math.max(...report.daily.map((d) => d.plays));
  return (
    <>
      <PageHeading
        eyebrow="PERFORMANCE & INSIGHTS"
        title={screens ? "Screen analytics" : "Content analytics"}
        description="Understand your network’s performance. All figures below are simulated demo metrics."
        actions={
          <>
            <select
              aria-label="Report date range"
              value={custom ? "custom" : String(days)}
              onChange={(e) => {
                setCustom(e.target.value === "custom");
                if (e.target.value !== "custom")
                  setDays(Number(e.target.value));
              }}
            >
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
            <button
              className="btn"
              onClick={() => exportCSV(rows, "mercury-analytics.csv")}
            >
              <Download size={15} />
              Export CSV
            </button>
            <button className="btn" onClick={() => window.print()}>
              <Printer size={15} />
              Print report
            </button>
          </>
        }
      />
      {custom && (
        <div className="custom-range">
          <label>
            From
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="overview-stats">
        <StatCard
          label="CONTENT PLAYS"
          value={total.toLocaleString()}
          change="Simulated playback events"
          icon={<Play />}
        />
        <StatCard
          label="AVERAGE UPTIME"
          value="97.6%"
          change="Demo screen availability"
          icon={<Activity />}
        />
        <StatCard
          label="AVERAGE DURATION"
          value="12.4s"
          change="Per content impression"
          icon={<Clock3 />}
        />
        <StatCard
          label="ACTIVE SCREENS"
          value="6"
          change="Sample reporting period"
          icon={<Monitor />}
        />
      </div>
      <section className="panel analytics-chart">
        <div className="panel-heading">
          <div>
            <h2>{screens ? "Network activity" : "Content plays over time"}</h2>
            <p>{effectiveDays}-day sample period</p>
          </div>
          <Badge>simulated data</Badge>
        </div>
        <div
          className="chart-bars"
          role="img"
          aria-label={`Demo daily content plays over ${effectiveDays} days`}
        >
          {report.daily.map((d, i) => (
            <div className="chart-column" key={d.date}>
              <span>{d.plays.toLocaleString()}</span>
              <div
                style={{ height: `${(d.plays / max) * 180}px` }}
                title={`${d.date}: ${d.plays} plays`}
              />
              <small>
                {effectiveDays < 10 || i % 5 === 0 ? d.date.slice(5) : ""}
              </small>
            </div>
          ))}
        </div>
      </section>
      <DataTable
        rows={rows}
        columns={
          screens
            ? [
                { key: "name", label: "Screen" },
                {
                  key: "uptime",
                  label: "Uptime",
                  render: (r) => (
                    <span className="uptime-cell">
                      <span>
                        <i style={{ width: `${r.uptime}%` }} />
                      </span>
                      {Number(r.uptime).toFixed(1)}%
                    </span>
                  ),
                },
                { key: "onlineHours", label: "Online hours" },
                { key: "syncFailures", label: "Sync failures" },
              ]
            : [
                { key: "name", label: "Most displayed products" },
                {
                  key: "plays",
                  label: "Content plays",
                  render: (r) => <b>{Number(r.plays).toLocaleString()}</b>,
                },
                {
                  key: "status",
                  label: "Data source",
                  render: () => <Badge>demo</Badge>,
                },
              ]
        }
      />
    </>
  );
}
export function RolesPage() {
  const { db, can, run } = useAdmin();
  const [editor, setEditor] = useState<Entity | null>(null);
  const permissions: Permission[] = [
    "products",
    "media",
    "campaigns",
    "playlists",
    "screens",
    "themes",
    "users",
    "publish",
    "analytics",
    "settings",
    "announcements",
    "schedules",
  ];
  return (
    <>
      <PageHeading
        eyebrow="ACCESS CONTROL"
        title="Roles & permissions"
        description="Give your team the access they need, and keep publishing in the right hands."
        actions={
          <button
            className="btn primary"
            disabled={!can("users")}
            onClick={() => setEditor(newEntity("roles", db))}
          >
            <Plus size={16} />
            Create role
          </button>
        }
      />
      <div className="form-hint">
        <ShieldCheck size={18} />
        Frontend role checks are for the demo workflow. Your backend must
        enforce permissions on every request.
      </div>
      <div className="panel permission-matrix">
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              {db.collections.roles.map((r) => (
                <th key={r.id}>
                  <button
                    className="text-button"
                    disabled={!can("users")}
                    onClick={() => setEditor(r)}
                  >
                    {r.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p}>
                <td>Manage {p === "publish" ? "publishing" : p}</td>
                {(db.collections.roles as Role[]).map((role) => (
                  <td key={role.id}>
                    <input
                      aria-label={`${role.name}: ${p}`}
                      type="checkbox"
                      checked={role.permissions.includes(p)}
                      disabled={!can("users") || role.id === "R001"}
                      onChange={(e) =>
                        run(
                          () =>
                            adminService.save("roles", {
                              ...role,
                              permissions: e.target.checked
                                ? [...role.permissions, p]
                                : role.permissions.filter((v) => v !== p),
                            }),
                          "Role permissions saved",
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editor && (
        <EntityEditor
          collection="roles"
          entity={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
export function PreviewPage() {
  const { db } = useAdmin();
  const [screenId, setScreenId] = useState(db.collections.screens[0]?.id || "");
  const [mode, setMode] = useState("published");
  const [contentId, setContentId] = useState("");
  const override = useMemo(() => {
    if (!contentId || mode === "published" || mode === "draft")
      return undefined;
    let playlistId = contentId;
    let collections = { ...db.collections };
    if (mode === "campaign") {
      playlistId = "preview-selected";
      collections = {
        ...collections,
        campaigns: db.collections.campaigns.map((c) =>
          c.id === contentId ? { ...c, status: "live" } : c,
        ),
        playlists: [
          ...db.collections.playlists,
          {
            id: playlistId,
            name: "Campaign preview",
            status: "published",
            updatedAt: "",
            items: [
              {
                id: "preview-campaign",
                type: "campaign",
                refId: contentId,
                title: "Campaign preview",
                duration: 60,
              },
            ],
          },
        ],
      };
    }
    if (mode === "scheduled") {
      const s = db.collections.schedules.find((s) => s.id === contentId);
      playlistId = String(s?.contentId || "main-showroom");
    }
    return {
      collections: {
        ...collections,
        screens: db.collections.screens.map((s) =>
          s.id === screenId
            ? {
                ...s,
                config: { ...(s as Screen).config, playlist: playlistId },
              }
            : s,
        ),
      },
    };
  }, [db, contentId, mode, screenId]);
  return (
    <>
      <PageHeading
        eyebrow="THE CUSTOMER’S VIEW"
        title="Live preview"
        description="The real TV frontend, right here in your control center."
        actions={
          <a
            className="btn primary"
            href={`/?screen=${screenId}&mode=display`}
            target="_blank"
            rel="noreferrer"
          >
            Open TV display
            <ArrowUpRight size={16} />
          </a>
        }
      />
      <div className="preview-selectors panel">
        <label>
          Screen
          <select
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
          >
            {db.collections.screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preview mode
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setContentId("");
            }}
          >
            <option value="published">Current published content</option>
            <option value="draft">Saved draft configuration</option>
            <option value="scheduled">Scheduled playlist</option>
            <option value="campaign">Preview campaign</option>
            <option value="playlist">Preview playlist</option>
          </select>
        </label>
        {["campaign", "playlist", "scheduled"].includes(mode) && (
          <label>
            Content
            <select
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
            >
              <option value="">Choose content…</option>
              {db.collections[
                mode === "campaign"
                  ? "campaigns"
                  : mode === "playlist"
                    ? "playlists"
                    : "schedules"
              ].map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="large-preview">
        <ScreenPreview
          screenId={screenId}
          published={mode === "published"}
          override={override}
        />
      </div>
      <div className="preview-footer-note">
        <span>
          <i className="dot green" />
          Local preview renderer
        </span>
        <span>
          Remote screenshots and live telemetry will be provided by the future
          device service.
        </span>
      </div>
    </>
  );
}
const helpTopics = [
  {
    title: "Adding products",
    text: "Open Products → Add product. Upload a photo, enter pricing and short specifications, then Save Draft or Mark ready to publish. Assign its ID in a screen’s featured or ticker list, save the screen, and publish the configuration.",
  },
  {
    title: "Creating campaigns",
    text: "Create a campaign with a headline, artwork and CTA. Mark it ready, then add it to a playlist. Use Preview to see the actual TV renderer before publishing.",
  },
  {
    title: "Registering TVs",
    text: "Register a screen with its name, branch, group and resolution. The six-digit PIN is a mock pairing code. Open the TV URL with ?screen=MERCURY-KLA-001. Real pairing requires your future backend.",
  },
  {
    title: "Creating playlists",
    text: "Add campaigns, products, images or videos. Drag items to reorder, or use the up/down buttons. Set durations and save the playlist. Assign it to a screen, then publish.",
  },
  {
    title: "Scheduling content",
    text: "Create date, time, repeat and priority rules in Schedules. The calendar previews your plan in Africa/Kampala. The production backend will resolve timed assignments and distribute configurations.",
  },
  {
    title: "Theme customization",
    text: "Go to Settings → Appearance. Choose a preset or edit HEX/RGB/HSL colors and typography. The TV preview updates immediately. Save the theme, then Apply to all screens, a group, or one screen.",
  },
  {
    title: "Troubleshooting offline screens",
    text: "Check the TV’s network and browser. In this demo status is simulated; Sync does not contact hardware. Products and local campaigns remain available after the TV app is loaded, but a fresh offline launch needs the static app server.",
  },
  {
    title: "Connecting your backend",
    text: "Set VITE_API_BASE_URL and implement the centralized service contracts documented in README. The chain is Admin → API/database → published screen configuration → TV. Upload files to shared object storage, replace mock auth with server sessions, enforce roles server-side, and connect a realtime adapter.",
  },
  {
    title: "Drafts, publishing and recovery",
    text: "Editing fields never changes TV content. Save drafts, mark content ready, review a preview, then publish selected screens. Versions can restore previous content as a draft. Export configuration backups from Settings → System.",
  },
];
export function HelpPage() {
  const [search, setSearch] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="MERCURY KNOWLEDGE BASE"
        title="How can we help?"
        description="A practical guide to running your display network."
      />
      <label className="help-search">
        <Search />
        <input
          placeholder="Search help topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="help-grid">
        {helpTopics
          .filter((t) =>
            `${t.title} ${t.text}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((t) => (
            <article className="panel help-card" key={t.title}>
              <BookOpen />
              <h2>{t.title}</h2>
              <p>{t.text}</p>
            </article>
          ))}
      </div>
    </>
  );
}
