import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Monitor,
  Radio,
  WifiOff,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Save,
  Power,
  Wrench,
  RotateCcw,
  VolumeX,
  Volume2,
  Download,
  Pause,
  Play,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import {
  PageHeading,
  DataTable,
  Badge,
  Confirm,
  Modal,
} from "../components/UI";
import { EntityEditor } from "../components/EntityEditor";
import { newEntity } from "../components/editorFields";
import { ScreenPreview } from "../components/ScreenPreview";
import { PublishDialog } from "../components/PublishDialog";
import { UnsavedGuard } from "../hooks/useUnsaved";
import { adminService } from "../services/adminService";
import { downloadJSON } from "../utils/export";
import type {
  Screen,
  ScreenCommand,
  ScreenConfiguration,
} from "../types/models";
export function ScreensPage({ devices = false }: { devices?: boolean }) {
  const { db, can, run } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [register, setRegister] = useState(false);
  const [assignment, setAssignment] = useState<{
    ids: string[];
    kind: "playlist" | "theme";
  } | null>(null);
  const [assignmentId, setAssignmentId] = useState("");
  const [command, setCommand] = useState<{
    ids: string[];
    action: ScreenCommand;
  } | null>(null);
  const [status, setStatus] = useState(params.get("status") || "all");
  const [branch, setBranch] = useState("all");
  const [publish, setPublish] = useState<string[] | null>(null);
  const screen = db.collections.screens.find(
    (s) => s.id === params.get("edit"),
  ) as Screen | undefined;
  if (screen)
    return (
      <ScreenDetail
        key={screen.id}
        screen={screen}
        onBack={() => setParams({})}
      />
    );
  const rows = db.collections.screens.filter(
    (s) =>
      (status === "all" || s.status === status) &&
      (branch === "all" || s.branchId === branch),
  );
  return (
    <>
      <PageHeading
        eyebrow="DISPLAY NETWORK"
        title={devices ? "Devices" : "Screens"}
        description="Know what’s playing, where it’s playing, and what needs your attention."
        actions={
          <>
            <a
              className="btn"
              href="/?pair=true"
              target="_blank"
              rel="noreferrer"
            >
              Pair a display
            </a>
            <button
              className="btn"
              disabled={!can("screens")}
              onClick={() =>
                setCommand({ ids: rows.map((s) => s.id), action: "sync" })
              }
            >
              <RefreshCw size={15} />
              Sync all screens
            </button>
            <button
              className="btn primary"
              disabled={!can("screens")}
              onClick={() => setRegister(true)}
            >
              <Plus size={16} />
              Register screen
            </button>
          </>
        }
      />
      <div className="screen-stats">
        {[
          {
            name: "All screens",
            value: db.collections.screens.length,
            status: "all",
            icon: Monitor,
          },
          {
            name: "Online",
            value: db.collections.screens.filter((s) => s.status === "online")
              .length,
            status: "online",
            icon: Radio,
          },
          {
            name: "Offline",
            value: db.collections.screens.filter((s) => s.status === "offline")
              .length,
            status: "offline",
            icon: WifiOff,
          },
          {
            name: "Syncing",
            value: db.collections.screens.filter((s) => s.status === "syncing")
              .length,
            status: "syncing",
            icon: RefreshCw,
          },
        ].map((s) => (
          <button
            className={status === s.status ? "active" : ""}
            onClick={() => setStatus(s.status)}
            key={s.status}
          >
            <s.icon />
            <span>
              {s.name}
              <b>{s.value}</b>
            </span>
          </button>
        ))}
      </div>
      <DataTable
        rows={rows}
        searchPlaceholder="Search screens…"
        onRow={(r) => setParams({ edit: r.id })}
        filters={
          <select
            aria-label="Screen branch filter"
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
        }
        columns={[
          {
            key: "name",
            label: "Screen",
            render: (r) => (
              <span className="screen-table-name">
                <span className="screen-table-icon">
                  <Monitor size={20} />
                </span>
                <span>
                  <b>{r.name}</b>
                  <small>{r.id}</small>
                </span>
              </span>
            ),
          },
          {
            key: "branchId",
            label: "Branch",
            render: (r) =>
              db.collections.branches.find((b) => b.id === r.branchId)?.name,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "config",
            label: "Current playlist",
            render: (r) =>
              db.collections.playlists.find(
                (p) => p.id === (r as Screen).config.playlist,
              )?.name,
          },
          {
            key: devices ? "ip" : "resolution",
            label: devices ? "IP address" : "Resolution",
          },
          {
            key: "lastSeen",
            label: "Last seen",
            render: (r) =>
              new Date(String(r.lastSeen)).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]}
        actions={(r) => (
          <button
            className="btn small"
            onClick={() => setParams({ edit: r.id })}
          >
            Manage
          </button>
        )}
        bulk={(ids, clear) => (
          <>
            <button
              className="text-button"
              disabled={!can("screens")}
              onClick={() => {
                setAssignmentId("");
                setAssignment({ ids, kind: "playlist" });
              }}
            >
              Assign playlist
            </button>
            <button
              className="text-button"
              disabled={!can("screens")}
              onClick={() => {
                setAssignmentId("");
                setAssignment({ ids, kind: "theme" });
              }}
            >
              Assign theme
            </button>
            <button
              className="text-button"
              disabled={!can("screens")}
              onClick={() => setCommand({ ids, action: "sync" })}
            >
              Sync
            </button>
            <button
              className="text-button"
              disabled={!can("publish")}
              onClick={() => setPublish(ids)}
            >
              Publish configuration
            </button>
            <button
              className="text-button"
              disabled={!can("screens")}
              onClick={() => setCommand({ ids, action: "maintenance" })}
            >
              Maintenance
            </button>
            <button className="text-button" onClick={clear}>
              Cancel
            </button>
          </>
        )}
      />
      <div className="global-controls panel">
        <div>
          <h3>Network controls</h3>
          <p>
            Commands are simulated locally. A backend will connect physical
            devices.
          </p>
        </div>
        {(["pause", "resume", "refresh"] as ScreenCommand[]).map((action) => (
          <button
            className="btn"
            disabled={!can("screens")}
            key={action}
            onClick={() =>
              setCommand({
                ids: db.collections.screens.map((s) => s.id),
                action,
              })
            }
          >
            {action === "pause" ? (
              <Pause size={14} />
            ) : action === "resume" ? (
              <Play size={14} />
            ) : (
              <RefreshCw size={14} />
            )}{" "}
            {action} all
          </button>
        ))}
      </div>
      {assignment && (
        <Modal
          title={`Assign ${assignment.kind}`}
          description="Update the selected screen drafts, then review and publish when ready."
          onClose={() => setAssignment(null)}
        >
          <div className="modal-padded">
            <label>
              {assignment.kind}
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
              >
                <option value="">Choose…</option>
                {(assignment.kind === "playlist"
                  ? db.collections.playlists
                  : db.themes
                ).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setAssignment(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!assignmentId}
              onClick={async () => {
                for (const id of assignment.ids) {
                  const target = db.collections.screens.find(
                    (s) => s.id === id,
                  ) as Screen;
                  const result = await run(() =>
                    adminService.save("screens", {
                      ...target,
                      config: {
                        ...target.config,
                        [assignment.kind]: assignmentId,
                      },
                    }),
                  );
                  if (!result) return;
                }
                setAssignment(null);
              }}
            >
              Save assignments
            </button>
          </div>
        </Modal>
      )}
      {(register || params.has("new")) && (
        <EntityEditor
          collection="screens"
          entity={newEntity("screens", db)}
          onClose={() => {
            setRegister(false);
            setParams({});
          }}
        />
      )}
      {command && (
        <Confirm
          title={`${command.action} ${command.ids.length} screens?`}
          description="This is a local command simulation. It does not contact physical TVs."
          onClose={() => setCommand(null)}
          onConfirm={() =>
            run(
              () => adminService.command(command.ids, command.action),
              `${command.action} command simulated`,
            )
          }
        />
      )}{" "}
      {publish && (
        <PublishDialog initialIds={publish} onClose={() => setPublish(null)} />
      )}
    </>
  );
}
function ScreenDetail({
  screen,
  onBack,
}: {
  screen: Screen;
  onBack: () => void;
}) {
  const { db, can, run, toast } = useAdmin();
  const [config, setConfig] = useState<ScreenConfiguration>(
    structuredClone(screen.config),
  );
  const [saved, setSaved] = useState(JSON.stringify(screen.config));
  const [command, setCommand] = useState<ScreenCommand | null>(null);
  const [publish, setPublish] = useState(false);
  const [close, setClose] = useState(false);
  const dirty = JSON.stringify(config) !== saved;
  const editable = can("screens");
  const save = async () => {
    if (
      config.settings.featuredRotation < 1000 ||
      config.settings.tickerRotation < 1000
    ) {
      toast("Rotation must be at least 1,000 ms.", true);
      return false;
    }
    const result = await run(
      () => adminService.save("screens", { ...screen, config }),
      "Screen configuration draft saved",
    );
    if (result) {
      setSaved(JSON.stringify(config));
      return true;
    }
    return false;
  };
  const toggleProduct = (
    key: "featuredProducts" | "tickerProducts",
    id: string,
  ) =>
    setConfig({
      ...config,
      [key]: config[key].includes(id)
        ? config[key].filter((v) => v !== id)
        : [...config[key], id],
    });
  const override = {
    collections: {
      ...db.collections,
      screens: db.collections.screens.map((s) =>
        s.id === screen.id ? { ...s, config } : s,
      ),
    },
  };
  return (
    <>
      <button
        className="back-link"
        onClick={() => (dirty ? setClose(true) : onBack())}
      >
        <ArrowLeft size={15} />
        All screens
      </button>
      <PageHeading
        eyebrow={screen.id}
        title={screen.name}
        description={`${db.collections.branches.find((b) => b.id === screen.branchId)?.name} · ${screen.location} · ${screen.resolution}`}
        actions={
          <>
            <Badge>{screen.status}</Badge>
            <button className="btn" disabled={!editable} onClick={() => save()}>
              <Save size={15} />
              Save Draft
            </button>
            <button
              className="btn primary"
              disabled={!can("publish") || dirty}
              onClick={() => setPublish(true)}
            >
              <Radio size={15} />
              Publish to screen
            </button>
          </>
        }
      />
      <div className="screen-detail-layout">
        <div>
          <ScreenPreview screenId={screen.id} override={override} />
          <section className="panel screen-config-editor">
            <h2>Screen configuration</h2>
            <div className="editor-grid">
              <label>
                Playlist
                <select
                  value={config.playlist}
                  disabled={!editable}
                  onChange={(e) =>
                    setConfig({ ...config, playlist: e.target.value })
                  }
                >
                  {db.collections.playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Layout
                <select
                  value={config.layout}
                  disabled={!editable}
                  onChange={(e) =>
                    setConfig({ ...config, layout: e.target.value })
                  }
                >
                  {db.layouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Signage theme
                <select
                  value={config.theme}
                  disabled={!editable}
                  onChange={(e) =>
                    setConfig({ ...config, theme: e.target.value })
                  }
                >
                  {db.themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Featured rotation (ms)
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={config.settings.featuredRotation}
                  disabled={!editable}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        featuredRotation: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                Ticker rotation (ms)
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={config.settings.tickerRotation}
                  disabled={!editable}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        tickerRotation: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <div>
                {(["showClock", "showPrices"] as const).map((key) => (
                  <label className="setting-toggle" key={key}>
                    <span>
                      {key === "showClock" ? "Show clock" : "Show prices"}
                    </span>
                    <input
                      type="checkbox"
                      checked={config.settings[key]}
                      disabled={!editable}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            {(["featuredProducts", "tickerProducts"] as const).map((key) => (
              <div className="product-assignment" key={key}>
                <h3>
                  {key === "featuredProducts"
                    ? "Featured products"
                    : "Ticker products"}{" "}
                  <span>{config[key].length} selected</span>
                </h3>
                <div className="multi-checks">
                  {db.collections.products.map((p) => (
                    <label key={p.id}>
                      <input
                        type="checkbox"
                        checked={config[key].includes(p.id)}
                        disabled={!editable}
                        onChange={() => toggleProduct(key, p.id)}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
        <aside>
          <section className="panel device-info">
            <h2>Device information</h2>
            {[
              ["Screen ID", screen.id],
              [
                "Group",
                db.collections.groups.find((g) => g.id === screen.groupId)
                  ?.name || "Unassigned",
              ],
              ["IP address", screen.ip || "Not reported"],
              ["Orientation", screen.orientation],
              [
                "Last seen",
                new Date(screen.lastSeen || Date.now()).toLocaleString(),
              ],
              ["Pairing PIN", screen.pairingPin],
              [
                "Published version",
                String(db.published[screen.id]?.version || "Not published"),
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
            <a
              className="btn full-width"
              href={`/?screen=${screen.id}&mode=display`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              Open TV display
            </a>
            <button
              className="btn full-width"
              onClick={() => downloadJSON(config, `${screen.id}-config.json`)}
            >
              <Download size={14} />
              Export configuration
            </button>
          </section>
          <section className="panel device-commands">
            <h2>Device commands</h2>
            <p>Simulated in this workspace</p>
            {(
              [
                { id: "sync", label: "Sync now", icon: RefreshCw },
                { id: "refresh", label: "Refresh content", icon: RefreshCw },
                { id: "restart", label: "Restart player", icon: RotateCcw },
                { id: "mute", label: "Mute", icon: VolumeX },
                { id: "unmute", label: "Unmute", icon: Volume2 },
                { id: "maintenance", label: "Maintenance mode", icon: Wrench },
                { id: "disable", label: "Disable screen", icon: Power },
              ] as const
            ).map((c) => (
              <button
                className="btn"
                key={c.id}
                disabled={!editable}
                onClick={() => setCommand(c.id)}
              >
                <c.icon size={15} />
                {c.label}
              </button>
            ))}
          </section>
        </aside>
      </div>
      <UnsavedGuard dirty={dirty} onSave={save} />
      {command && (
        <Confirm
          title={`${command} this screen?`}
          description="The command is recorded as a local simulation."
          onClose={() => setCommand(null)}
          onConfirm={() =>
            run(
              () => adminService.command([screen.id], command),
              `${command} simulated`,
            )
          }
        />
      )}{" "}
      {publish && (
        <PublishDialog
          initialIds={[screen.id]}
          onClose={() => setPublish(false)}
        />
      )}{" "}
      {close && (
        <Modal title="You have unsaved changes" onClose={() => setClose(false)}>
          <div className="modal-footer">
            <button className="btn" onClick={() => setClose(false)}>
              Stay
            </button>
            <button className="btn" onClick={onBack}>
              Discard
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (await save()) onBack();
              }}
            >
              Save Draft
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
