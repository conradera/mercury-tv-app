import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Monitor,
  Radio,
  Megaphone,
  Package,
  Plus,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  CalendarDays,
  Upload,
  ListVideo,
  Clock3,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { PageHeading, StatCard, Badge } from "../components/UI";
import { ScreenPreview } from "../components/ScreenPreview";
import { PublishDialog } from "../components/PublishDialog";
import { adminService } from "../services/adminService";
import type { Screen } from "../types/models";
export function DashboardPage() {
  const { db, user, run, can } = useAdmin();
  const [publish, setPublish] = useState(false);
  const [branch, setBranch] = useState("all");
  const [activity, setActivity] = useState("all");
  const screens = (db.collections.screens as Screen[]).filter(
    (s) => branch === "all" || s.branchId === branch,
  );
  const online = screens.filter((s) => s.status === "online").length;
  const offline = screens.filter((s) => s.status === "offline").length;
  const campaigns = db.collections.campaigns.filter(
    (c) => c.status === "live",
  ).length;
  const products = db.collections.products.filter(
    (p) => p.status === "published",
  ).length;
  const drafts = ["products", "campaigns", "playlists"].reduce(
    (n, k) =>
      n +
      db.collections[k as "products"].filter((p) => p.status === "draft")
        .length,
    0,
  );
  const hour = new Date().getHours();
  return (
    <>
      <PageHeading
        eyebrow="YOUR NETWORK AT A GLANCE"
        title={`Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0] || "Admin"}`}
        description="Here’s what’s happening across your Mercury displays today."
        actions={
          <>
            <select
              aria-label="Dashboard branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="all">All branches</option>
              {db.collections.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              className="btn primary"
              disabled={!can("publish")}
              onClick={() => setPublish(true)}
            >
              <Radio size={16} />
              Review & publish
            </button>
          </>
        }
      />
      <div className="overview-stats">
        <StatCard
          label="TOTAL SCREENS"
          value={screens.length}
          change={`Across ${db.collections.branches.length} Mercury locations`}
          icon={<Monitor />}
        />
        <StatCard
          label="SCREENS ONLINE"
          value={`${online} / ${screens.length}`}
          change={`${screens.length ? Math.round((online / screens.length) * 100) : 0}% of your network is connected`}
          icon={<Radio />}
        />
        <StatCard
          label="ACTIVE CAMPAIGNS"
          value={campaigns}
          change={`${db.collections.campaigns.filter((c) => c.status === "scheduled").length} scheduled to go live`}
          icon={<Megaphone />}
        />
        <StatCard
          label="PRODUCTS IN ROTATION"
          value={products}
          change={`${db.collections.products.length} products in your library`}
          icon={<Package />}
        />
      </div>

      <div className="workspace-notice">
        <span className="notice-icon">
          <span />
        </span>
        <div>
          <strong>Your next great display is one publish away.</strong>
          <p>
            You have {drafts} content drafts. Review your changes and bring them
            to your screens.
          </p>
        </div>
        <button className="text-button" onClick={() => setPublish(true)}>
          Review changes
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="dashboard-grid">
        <section className="panel network-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Screen overview{" "}
                <span className="count-badge">{screens.length}</span>
              </h2>
              <p>A live look at your display network</p>
            </div>
            <Link to="/admin/screens" className="text-button">
              View all screens
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="network-summary">
            <span>
              <i className="dot green" />
              {online} online
            </span>
            <span>
              <i className="dot amber" />
              {screens.filter((s) => s.status === "syncing").length} syncing
            </span>
            <span>
              <i className="dot red" />
              {offline} offline
            </span>
            <button
              className="text-button"
              disabled={!can("screens")}
              onClick={() =>
                run(
                  () =>
                    adminService.command(
                      screens.map((s) => s.id),
                      "sync",
                    ),
                  "Sync simulated for selected screens",
                )
              }
            >
              <RefreshCw size={13} />
              Sync network
            </button>
          </div>
          <div className="screen-overview-list">
            {screens.slice(0, 4).map((s, i) => (
              <Link
                to={`/admin/screens?edit=${s.id}`}
                className="screen-overview-row"
                key={s.id}
              >
                <div className={`screen-thumbnail thumb-${i}`}>
                  <Monitor />
                  <span>mercury</span>
                </div>
                <div className="screen-row-name">
                  <b>{s.name}</b>
                  <small>
                    {
                      db.collections.branches.find((b) => b.id === s.branchId)
                        ?.name
                    }{" "}
                    <i>·</i> {s.location}
                  </small>
                </div>
                <div className="screen-row-playing">
                  <span>
                    {s.status === "offline" ? "LAST SEEN" : "NOW PLAYING"}
                  </span>
                  <small>
                    {s.status === "offline"
                      ? "18 minutes ago"
                      : db.collections.playlists.find(
                          (p) => p.id === s.config.playlist,
                        )?.name}
                  </small>
                </div>
                <Badge>{s.status}</Badge>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
          {offline > 0 && (
            <Link to="/admin/screens?status=offline" className="network-alert">
              <AlertTriangle size={15} />
              {offline} screens need your attention
              <span>
                View alerts
                <ArrowRight size={14} />
              </span>
            </Link>
          )}
        </section>
        <section className="panel now-live-panel">
          <div className="panel-heading">
            <div>
              <span className="small-kicker">
                <i className="dot green" />
                ON AIR
              </span>
              <h2>Main showroom</h2>
            </div>
            <Link
              className="icon-button"
              aria-label="Open live preview"
              to="/admin/preview"
            >
              <ArrowUpRight />
            </Link>
          </div>
          <ScreenPreview
            screenId="MERCURY-KLA-001"
            published
            controls={false}
          />
          <div className="now-live-caption">
            <div>
              <b>Main showroom playlist</b>
              <small>1920 × 1080 · Landscape</small>
            </div>
            <Badge>online</Badge>
          </div>
          <Link to="/admin/preview" className="btn full-width">
            Open live preview
            <ArrowUpRight size={15} />
          </Link>
        </section>
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>Coming up today</h2>
              <p>Keep your content right on time</p>
            </div>
            <Link className="text-button" to="/admin/schedules">
              View schedule
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="schedule-timeline">
            {db.collections.schedules.slice(0, 3).map((s, i) => (
              <Link to={`/admin/schedules?edit=${s.id}`} key={s.id}>
                <span className="timeline-time">
                  {String(s.startTime)}
                  <small>EAT</small>
                </span>
                <div className={`timeline-marker marker-${i}`} />
                <div>
                  <b>{s.name}</b>
                  <small>
                    {String(s.type)} <i>·</i> Main showroom
                  </small>
                </div>
                <Badge>{i === 0 ? "scheduled" : "upcoming"}</Badge>
              </Link>
            ))}
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>The latest from your workspace</p>
            </div>
            <select
              aria-label="Activity filter"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            >
              <option value="all">All activity</option>
              {["products", "media", "screens", "users", "campaigns"].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </div>
          <div className="activity-feed">
            {db.logs
              .filter((l) => activity === "all" || l.module === activity)
              .slice(0, 4)
              .map((l, i) => (
                <div key={l.id}>
                  <span className={`activity-avatar av-${i}`}>
                    {l.actor[0]}
                  </span>
                  <div>
                    <p>
                      <b>{l.actor}</b> {l.action.toLowerCase()}
                    </p>
                    <strong>{l.target}</strong>
                  </div>
                  <time>
                    {new Date(l.time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}
          </div>
          <Link className="activity-all text-button" to="/admin/logs">
            View activity log
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="quick-actions">
        <div>
          <h2>Make something happen</h2>
          <p>A shortcut to your next update.</p>
        </div>
        {[
          { name: "Add product", path: "products", icon: Plus },
          { name: "Upload media", path: "media", icon: Upload },
          { name: "Create campaign", path: "campaigns", icon: Megaphone },
          { name: "Build playlist", path: "playlists", icon: ListVideo },
          { name: "Register screen", path: "screens", icon: Monitor },
          { name: "Schedule content", path: "schedules", icon: CalendarDays },
        ].map((a) => (
          <Link key={a.path} to={`/admin/${a.path}?new=1`}>
            <a.icon size={18} />
            <span>{a.name}</span>
            <ArrowUpRight size={12} />
          </Link>
        ))}
      </section>
      <div className="secondary-metrics">
        <span>
          <b>{db.collections.media.length}</b> media assets
        </span>
        <span>
          <b>{db.collections.schedules.length}</b> scheduled events
        </span>
        <span>
          <b>2,438</b> demo plays today
        </span>
        <span>
          <Clock3 size={13} />
          Telemetry is simulated in this workspace
        </span>
      </div>
      {publish && <PublishDialog onClose={() => setPublish(false)} />}
    </>
  );
}
