import { youtubeId } from "../../utils/youtube";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  ListVideo,
  Clock3,
  Monitor,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  ArrowLeft,
  Save,
  Eye,
  Play,
  Image,
  Film,
  Megaphone,
  Package,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { PageHeading, Badge, Modal, Empty } from "../components/UI";
import { adminService } from "../services/adminService";
import { newEntity } from "../components/editorFields";
import { UnsavedGuard } from "../hooks/useUnsaved";
import { ScreenPreview } from "../components/ScreenPreview";
import type { Playlist, PlaylistItem, Screen } from "../types/models";
export function PlaylistsPage() {
  const { db, can } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Playlist | null>(null);
  const existing = db.collections.playlists.find(
    (p) => p.id === params.get("edit"),
  ) as Playlist | undefined;
  const open = editing || existing;
  const create = () =>
    setEditing({
      ...newEntity("playlists", db),
      name: "Untitled playlist",
    } as Playlist);
  if (params.has("new") && !open)
    return (
      <PlaylistEditor
        initial={
          {
            ...newEntity("playlists", db),
            name: "Untitled playlist",
          } as Playlist
        }
        onClose={() => setParams({})}
      />
    );
  if (open)
    return (
      <PlaylistEditor
        key={open.id}
        initial={open}
        onClose={() => {
          setEditing(null);
          setParams({});
        }}
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="CONTENT ORCHESTRATION"
        title="Playlists"
        description="The right content, in the right order. Build a better showroom story."
        actions={
          <button
            className="btn primary"
            disabled={!can("playlists")}
            onClick={create}
          >
            <Plus size={16} />
            Create playlist
          </button>
        }
      />
      <div className="content-card-grid playlist-grid">
        {(db.collections.playlists as Playlist[]).map((p) => (
          <button
            className="playlist-card"
            key={p.id}
            onClick={() => setEditing(p)}
          >
            <div className="playlist-cover">
              <div className="playlist-stack">
                <span />
                <span />
                <ListVideo />
              </div>
              <Badge>{p.status}</Badge>
            </div>
            <div className="playlist-info">
              <h3>{p.name}</h3>
              <div>
                <span>
                  <ListVideo size={14} />
                  {p.items.length} items
                </span>
                <span>
                  <Clock3 size={14} />
                  {p.items.some(
                    (i) => i.type === "youtube" && i.playUntilEnd !== false,
                  )
                    ? "Full videos"
                    : `${p.items.reduce((n, i) => n + i.duration, 0)}s`}
                </span>
              </div>
              <footer>
                <span>
                  <Monitor size={14} />
                  {
                    (db.collections.screens as Screen[]).filter(
                      (s) => s.config.playlist === p.id,
                    ).length
                  }{" "}
                  screens
                </span>
                <span>
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </footer>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
function PlaylistEditor({
  initial,
  onClose,
}: {
  initial: Playlist;
  onClose: () => void;
}) {
  const { db, can, run, toast } = useAdmin();
  const [draft, setDraft] = useState(structuredClone(initial));
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeLinks, setYoutubeLinks] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [add, setAdd] = useState(false);
  const [source, setSource] = useState("campaigns");
  const [preview, setPreview] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dirty = JSON.stringify(draft) !== saved;
  const editable = can("playlists");
  const save = async (published = false) => {
    if (!draft.name.trim()) {
      toast("Give your playlist a name.", true);
      return false;
    }
    if (!draft.items.length) {
      toast("Add at least one playlist item.", true);
      return false;
    }
    if (
      draft.items.some(
        (i) =>
          (!(i.type === "youtube" && i.playUntilEnd !== false) &&
            (!Number.isFinite(i.duration) || i.duration < 1)) ||
          i.startTime < 0 ||
          (i.endTime > 0 && i.endTime <= i.startTime),
      )
    ) {
      toast("Check item durations and start/end times.", true);
      return false;
    }
    const value = { ...draft, status: published ? "published" : "draft" };
    const result = await run(
      () => adminService.save("playlists", value),
      "Playlist saved. Publish to screens to apply it.",
    );
    if (result) {
      setDraft(value);
      setSaved(JSON.stringify(value));
      return true;
    }
    return false;
  };
  const move = (from: number, to: number) => {
    if (!editable || to < 0 || to >= draft.items.length) return;
    const items = [...draft.items];
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    setDraft({ ...draft, items });
  };
  const update = (id: string, patch: Partial<PlaylistItem>) =>
    setDraft({
      ...draft,
      items: draft.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  const icon = (type: string) =>
    type === "campaign" ? (
      <Megaphone />
    ) : type === "product" ? (
      <Package />
    ) : type === "image" ? (
      <Image />
    ) : (
      <Film />
    );
  const sources = db.collections[source as "campaigns" | "media" | "products"];
  const override = {
    collections: {
      ...db.collections,
      playlists: [
        ...db.collections.playlists.filter((p) => p.id !== draft.id),
        draft,
      ],
      screens: db.collections.screens.map((s, i) =>
        i === 0
          ? { ...s, config: { ...(s as Screen).config, playlist: draft.id } }
          : s,
      ),
    },
  };
  return (
    <>
      <button
        className="back-link"
        onClick={() => (dirty ? setCloseConfirm(true) : onClose())}
      >
        <ArrowLeft size={15} />
        All playlists
      </button>
      <PageHeading
        eyebrow="PLAYLIST EDITOR"
        title={draft.name}
        description={`${draft.items.length} items · ${draft.items.some((i) => i.type === "youtube" && i.playUntilEnd !== false) ? "Full video playback" : `${draft.items.reduce((n, i) => n + i.duration, 0)} seconds`} · Drag to arrange your story.`}
        actions={
          <>
            <button className="btn" onClick={() => setPreview(true)}>
              <Eye size={15} />
              Preview
            </button>
            <button
              className="btn"
              disabled={!editable}
              onClick={() => save(false)}
            >
              <Save size={15} />
              Save Draft
            </button>
            <button
              className="btn primary"
              disabled={!can("publish") || !editable}
              onClick={() => save(true)}
            >
              <Play size={15} />
              Mark ready
            </button>
          </>
        }
      />
      <div className="playlist-editor-layout">
        <section className="panel playlist-items">
          <div className="panel-heading">
            <h2>Playback sequence</h2>
            <button
              className="btn primary small"
              disabled={!editable}
              onClick={() => setYoutubeOpen(true)}
            >
              <Plus size={15} />
              Add YouTube links
            </button>
            <button
              className="btn small"
              disabled={!editable}
              onClick={() => setAdd(true)}
            >
              <Plus size={15} />
              Add content
            </button>
          </div>
          {draft.items.map((item, i) => (
            <article
              className="playlist-item"
              key={item.id}
              draggable={editable}
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
            >
              <span className="drag-handle">
                <GripVertical size={18} />
              </span>
              <span className="playlist-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="playlist-item-icon">{icon(item.type)}</div>
              <div className="playlist-item-main">
                <b>{item.title}</b>
                <span>{item.type}</span>
                <div className="item-options">
                  {item.type === "youtube" && (
                    <label>
                      <input
                        type="checkbox"
                        disabled={!editable}
                        checked={item.playUntilEnd !== false}
                        onChange={(e) =>
                          update(item.id, { playUntilEnd: e.target.checked })
                        }
                      />
                      Play full video
                    </label>
                  )}
                  <label>
                    Duration
                    <input
                      aria-label={`Duration for ${item.title}`}
                      type="number"
                      min="1"
                      value={item.duration}
                      disabled={
                        !editable ||
                        (item.type === "youtube" && item.playUntilEnd !== false)
                      }
                      onChange={(e) =>
                        update(item.id, { duration: Number(e.target.value) })
                      }
                    />
                    <small>sec</small>
                  </label>
                  <label>
                    Transition
                    <select
                      value={item.transition}
                      disabled={!editable}
                      onChange={(e) =>
                        update(item.id, { transition: e.target.value })
                      }
                    >
                      {["Fade", "Crossfade", "Slide"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  {["youtube", "video"].includes(item.type) && (
                    <>
                      <label>
                        Start
                        <input
                          type="number"
                          min="0"
                          value={item.startTime}
                          onChange={(e) =>
                            update(item.id, {
                              startTime: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        End
                        <input
                          type="number"
                          min="0"
                          value={item.endTime}
                          onChange={(e) =>
                            update(item.id, { endTime: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.muted}
                          onChange={(e) =>
                            update(item.id, { muted: e.target.checked })
                          }
                        />
                        Mute
                      </label>
                    </>
                  )}
                </div>
              </div>
              <div className="playlist-item-actions">
                <button
                  className="icon-button"
                  disabled={i === 0 || !editable}
                  aria-label={`Move ${item.title} up`}
                  onClick={() => move(i, i - 1)}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="icon-button"
                  disabled={i === draft.items.length - 1 || !editable}
                  aria-label={`Move ${item.title} down`}
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  className="icon-button danger-text"
                  disabled={!editable}
                  aria-label={`Remove ${item.title}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      items: draft.items.filter((v) => v.id !== item.id),
                    })
                  }
                >
                  <X size={16} />
                </button>
              </div>
            </article>
          ))}
          {!draft.items.length && (
            <Empty
              title="Your story starts here"
              description="Add a campaign, product, image or video to your playlist."
              action={
                <button className="btn primary" onClick={() => setAdd(true)}>
                  Add content
                </button>
              }
            />
          )}
        </section>
        <aside className="panel playlist-settings">
          <h2>Playlist settings</h2>
          <label>
            Playlist name
            <input
              value={draft.name}
              disabled={!editable}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          {[
            { key: "loop", label: "Loop continuously" },
            { key: "shuffle", label: "Shuffle items" },
            { key: "preload", label: "Preload next media" },
          ].map((s) => (
            <label className="setting-toggle" key={s.key}>
              <span>{s.label}</span>
              <input
                type="checkbox"
                disabled={!editable}
                checked={!!draft[s.key]}
                onChange={(e) =>
                  setDraft({ ...draft, [s.key]: e.target.checked })
                }
              />
            </label>
          ))}
          <label>
            Fallback playlist
            <select
              value={draft.fallback}
              disabled={!editable}
              onChange={(e) => setDraft({ ...draft, fallback: e.target.value })}
            >
              <option value="">Local product rotation</option>
              {db.collections.playlists
                .filter((p) => p.id !== draft.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="form-hint">
            Changes stay in the editor until saved. Publish a screen
            configuration to update the TV.
          </div>
          <span className="unsaved-label">
            {dirty ? "● Unsaved changes" : "✓ All changes saved"}
          </span>
        </aside>
      </div>
      <UnsavedGuard dirty={dirty} onSave={() => save(false)} />
      {closeConfirm && (
        <Modal
          title="You have unsaved changes"
          onClose={() => setCloseConfirm(false)}
        >
          <div className="modal-footer">
            <button className="btn" onClick={() => setCloseConfirm(false)}>
              Stay
            </button>
            <button className="btn" onClick={onClose}>
              Discard
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (await save(false)) onClose();
              }}
            >
              Save Draft
            </button>
          </div>
        </Modal>
      )}
      {youtubeOpen && (
        <Modal
          title="Add YouTube links"
          description="Paste one video link per line. Videos play to the end, then the playlist repeats."
          onClose={() => setYoutubeOpen(false)}
        >
          <div className="modal-padded">
            <label>
              YouTube video links
              <textarea
                aria-label="YouTube video links"
                rows={8}
                value={youtubeLinks}
                onChange={(e) => {
                  setYoutubeLinks(e.target.value);
                  setYoutubeError("");
                }}
                placeholder={
                  "https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."
                }
              />
            </label>
            <p className="form-hint">
              Supports watch, share, Shorts and live video links. You can
              reorder or remove videos after adding them. Internet access and
              videos that allow embedding are required.
            </p>
            {youtubeError && (
              <p role="alert" className="danger-text">
                {youtubeError}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setYoutubeOpen(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                const links = youtubeLinks
                  .split(/\r?\n/)
                  .map((v) => v.trim())
                  .filter(Boolean);
                if (!links.length) {
                  setYoutubeError("Paste at least one YouTube video link.");
                  return;
                }
                const invalid = links
                  .map((url, i) => (youtubeId(url) ? 0 : i + 1))
                  .filter(Boolean);
                if (invalid.length) {
                  setYoutubeError(
                    `Check the YouTube video links on lines ${invalid.join(", ")}.`,
                  );
                  return;
                }
                const ids = [...new Set(links.map(youtubeId))];
                setDraft({
                  ...draft,
                  loop: true,
                  items: [
                    ...draft.items,
                    ...ids.map((id) => ({
                      id: crypto.randomUUID(),
                      type: "youtube" as const,
                      refId: "",
                      title: `YouTube · ${id}`,
                      url: `https://www.youtube.com/watch?v=${id}`,
                      duration: 30,
                      playUntilEnd: true,
                      transition: "Crossfade",
                      muted: true,
                      startTime: 0,
                      endTime: 0,
                    })),
                  ],
                });
                setYoutubeLinks("");
                setYoutubeOpen(false);
                toast(
                  `${ids.length} YouTube videos added. Continuous loop enabled.`,
                );
              }}
            >
              Add videos to playlist
            </button>
          </div>
        </Modal>
      )}
      {add && (
        <Modal
          title="Add to playlist"
          description="Choose content from your library."
          onClose={() => setAdd(false)}
        >
          <div className="modal-padded">
            <div className="tab-buttons">
              {["campaigns", "media", "products"].map((t) => (
                <button
                  key={t}
                  className={source === t ? "active" : ""}
                  onClick={() => setSource(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="source-list">
              {sources.map((row) => (
                <button
                  key={row.id}
                  onClick={() => {
                    const type =
                      source === "campaigns"
                        ? "campaign"
                        : source === "products"
                          ? "product"
                          : (String(row.type) as PlaylistItem["type"]);
                    setDraft({
                      ...draft,
                      items: [
                        ...draft.items,
                        {
                          id: crypto.randomUUID(),
                          type,
                          refId: row.id,
                          title: row.name,
                          url: String(row.url || ""),
                          duration: Number(row.duration) || 12,
                          playUntilEnd: type === "youtube",
                          transition: "Crossfade",
                          muted: true,
                          startTime: 0,
                          endTime: 0,
                        },
                      ],
                    });
                    setAdd(false);
                  }}
                >
                  {icon(String(row.type || source))}
                  <span>
                    <b>{row.name}</b>
                    <small>{row.status}</small>
                  </span>
                  <Plus size={15} />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal wide title="Playlist preview" onClose={() => setPreview(false)}>
          <ScreenPreview override={override} />
        </Modal>
      )}
    </>
  );
}
