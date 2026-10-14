import { websiteProductsEnabled } from "../../services/websiteProductService";
import { collectionColumns } from "../components/collectionColumns";
import { useRef, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Archive,
  Grid2X2,
  List,
  Image,
  Film,
  Youtube,
  Folder,
  Tag,
  History,
  Play,
  Pause,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { adminService } from "../services/adminService";
import { collectionPermission } from "../services/mockStore";
import {
  PageHeading,
  DataTable,
  Badge,
  AssetImage,
  Modal,
  Confirm,
  Empty,
  type Column,
} from "../components/UI";
import { EntityEditor } from "../components/EntityEditor";
import { newEntity } from "../components/editorFields";
import { ScreenPreview } from "../components/ScreenPreview";
import { exportCSV } from "../utils/export";
import { formatCurrency } from "../../utils/currency";
import type { Collection, Entity, Playlist, Screen } from "../types/models";
const details: Partial<
  Record<Collection, { title: string; description: string; singular: string }>
> = {
  products: {
    title: "Products",
    description:
      "The technology at the heart of your showroom. Curate what customers see.",
    singular: "product",
  },
  media: {
    title: "Media library",
    description: "A home for every image, video, and story on your screens.",
    singular: "media",
  },
  campaigns: {
    title: "Campaigns",
    description:
      "Turn your next big idea into a remarkable in-store experience.",
    singular: "campaign",
  },
  announcements: {
    title: "Announcements",
    description:
      "Keep customers informed, from daily updates to urgent notices.",
    singular: "announcement",
  },
  groups: {
    title: "Screen groups",
    description: "Organize displays and manage content together.",
    singular: "screen group",
  },
  branches: {
    title: "Branches",
    description: "Every location, connected to one Mercury network.",
    singular: "branch",
  },
  users: {
    title: "Users",
    description: "The people behind your display network.",
    singular: "user",
  },
  categories: {
    title: "Product categories",
    description: "Keep your product library organized and easy to browse.",
    singular: "category",
  },
};
export function CollectionPage({ collection }: { collection: Collection }) {
  const { db, run, toast, can } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [localEditor, setLocalEditor] = useState<Entity | null>(null);
  const [remove, setRemove] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<Entity | null>(null);
  const [history, setHistory] = useState<Entity | null>(null);
  const [assignment, setAssignment] = useState<string[] | null>(null);
  const [assignScreen, setAssignScreen] = useState("");
  const [assignmentKind, setAssignmentKind] = useState("screen");
  const [maxPrice, setMaxPrice] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [grid, setGrid] = useState(
    ["media", "campaigns", "groups", "branches"].includes(collection),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [featured, setFeatured] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const meta = details[collection] || {
    title: collection,
    description: "Manage your Mercury workspace.",
    singular: collection,
  };
  const editable = can(collectionPermission[collection]);
  const records =
    collection === "categories"
      ? [...db.collections.categories].sort(
          (a, b) => Number(a.order) - Number(b.order),
        )
      : db.collections[collection];
  const isNew = params.has("new");
  const fresh = useMemo(() => newEntity(collection, db), [collection, isNew]);
  const fromQuery = isNew
    ? fresh
    : records.find((r) => r.id === params.get("edit"));
  const editor = localEditor || fromQuery;
  const closeEditor = () => {
    setLocalEditor(null);
    setParams({});
  };
  const filtered = records.filter(
    (r) =>
      (filter === "all" ||
        r.status === filter ||
        r.type === filter ||
        (filter === "unused" && !usage(r.id)) ||
        (filter === "in-use" && usage(r.id) > 0)) &&
      (category === "all" || r.category === category) &&
      (brand === "all" || r.brand === brand) &&
      (availability === "all" || r.availability === availability) &&
      (!featured || r.featured) &&
      (!maxPrice || Number(r.price) <= Number(maxPrice)) &&
      (campaignFilter === "all" ||
        (
          (db.collections.campaigns.find((c) => c.id === campaignFilter)
            ?.productIds as string[]) || []
        ).includes(r.id)) &&
      (visibility === "all" ||
        !Array.isArray(r.screenIds) ||
        !r.screenIds.length ||
        r.screenIds.includes(visibility)) &&
      r.name.toLowerCase().includes(search.toLowerCase()),
  );
  function usage(id: string) {
    return (db.collections.playlists as Playlist[]).reduce(
      (n, p) => n + p.items.filter((i) => i.refId === id).length,
      0,
    );
  }
  const duplicate = (row: Entity) =>
    setLocalEditor({
      ...structuredClone(row),
      id: `${row.id}-${Date.now().toString(36)}`,
      name: `${row.name} (copy)`,
      status: "draft",
    });
  const updateStatus = (row: Entity, status: string) =>
    run(
      () => adminService.save(collection, { ...row, status }),
      `Content ${status}`,
    );
  const actions = (row: Entity) => (
    <details
      className="row-actions"
      onToggle={(e) => {
        const node = e.currentTarget;
        const popup = node.querySelector<HTMLElement>(".popover");
        if (node.open && popup) {
          const bounds = node.getBoundingClientRect();
          popup.style.position = "fixed";
          popup.style.top = `${Math.min(bounds.bottom + 4, innerHeight - 280)}px`;
          popup.style.right = `${Math.max(12, innerWidth - bounds.right)}px`;
        }
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button"))
          e.currentTarget.open = false;
      }}
    >
      <summary aria-label={`Actions for ${row.name}`}>
        <MoreHorizontal size={18} />
      </summary>
      <div className="popover">
        <button onClick={() => setPreview(row)}>
          <Eye size={14} />
          Preview
        </button>
        {editable && (
          <>
            <button onClick={() => setLocalEditor(row)}>
              <Pencil size={14} />
              Edit
            </button>
            <button onClick={() => duplicate(row)}>
              <Copy size={14} />
              Duplicate
            </button>
            {["products", "campaigns", "media", "announcements"].includes(
              collection,
            ) &&
              can("publish") && (
                <button
                  onClick={() =>
                    updateStatus(
                      row,
                      collection === "campaigns" ? "live" : "published",
                    )
                  }
                >
                  <Play size={14} />
                  Mark ready
                </button>
              )}
            {collection === "campaigns" && (
              <button onClick={() => updateStatus(row, "paused")}>
                <Pause size={14} />
                Pause campaign
              </button>
            )}
            <button onClick={() => setHistory(row)}>
              <History size={14} />
              Version history
            </button>
            <button onClick={() => updateStatus(row, "archived")}>
              <Archive size={14} />
              Archive
            </button>
            <button className="danger-text" onClick={() => setRemove([row.id])}>
              <Trash2 size={14} />
              Delete
            </button>
          </>
        )}
      </div>
    </details>
  );
  const columns = collectionColumns(collection, db, usage);
  const bulk = (ids: string[], clear: () => void) => (
    <>
      {editable && (
        <>
          <button
            className="text-button"
            onClick={async () => {
              for (const id of ids) {
                const row = records.find((r) => r.id === id)!;
                await updateStatus(row, "archived");
              }
              clear();
            }}
          >
            Archive
          </button>
          {can("publish") && (
            <button
              className="text-button"
              onClick={async () => {
                for (const id of ids)
                  await updateStatus(
                    records.find((r) => r.id === id)!,
                    collection === "campaigns" ? "live" : "published",
                  );
                clear();
              }}
            >
              Mark ready
            </button>
          )}
          <button
            className="text-button"
            onClick={async () => {
              for (const id of ids)
                await updateStatus(
                  records.find((r) => r.id === id)!,
                  "unpublished",
                );
              clear();
            }}
          >
            Unpublish
          </button>
          <button
            className="text-button"
            onClick={() => {
              setAssignmentKind("screen");
              setAssignment(ids);
            }}
          >
            Assign screen
          </button>
          <button
            className="text-button"
            onClick={() => {
              setAssignmentKind("group");
              setAssignment(ids);
            }}
          >
            Assign group
          </button>
          {collection === "products" && (
            <button
              className="text-button"
              onClick={() => {
                setAssignmentKind("category");
                setAssignment(ids);
              }}
            >
              Change category
            </button>
          )}
          <button
            className="text-button danger-text"
            onClick={() => setRemove(ids)}
          >
            Delete
          </button>
        </>
      )}
    </>
  );
  const previewOverride = preview
    ? {
        collections: {
          ...db.collections,
          products:
            collection === "products"
              ? db.collections.products.map((p) =>
                  p.id === preview.id ? { ...preview, status: "published" } : p,
                )
              : db.collections.products,
          campaigns:
            collection === "campaigns"
              ? [
                  ...db.collections.campaigns.filter(
                    (c) => c.id !== preview.id,
                  ),
                  { ...preview, status: "live" },
                ]
              : db.collections.campaigns,
          playlists: [
            ...db.collections.playlists,
            {
              id: "preview-content",
              name: "Content preview",
              status: "published",
              updatedAt: "",
              items: [
                {
                  id: "preview-item",
                  type:
                    collection === "products"
                      ? "product"
                      : collection === "campaigns"
                        ? "campaign"
                        : preview.type,
                  refId: preview.id,
                  title: preview.name,
                  url: preview.url,
                  duration: 60,
                },
              ],
            },
          ],
          screens: db.collections.screens.map((s, i) =>
            i === 0
              ? {
                  ...s,
                  config: {
                    ...(s as Screen).config,
                    playlist: "preview-content",
                  },
                }
              : s,
          ),
        },
      }
    : undefined;
  return (
    <>
      <PageHeading
        eyebrow="CONTENT LIBRARY"
        title={meta.title}
        description={
          collection === "products" && websiteProductsEnabled
            ? "Live Mercury website catalog · USD prices · refreshed every minute. Edit display settings here; manage product details on the website."
            : meta.description
        }
        actions={
          <>
            <button
              className="btn"
              onClick={() => exportCSV(filtered, `${collection}.csv`)}
            >
              <Download size={15} />
              Export
            </button>
            {collection === "products" && (
              <>
                <input
                  hidden
                  type="file"
                  accept="application/json"
                  ref={fileInput}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = JSON.parse(await file.text());
                      if (
                        !Array.isArray(data) ||
                        data.length > 500 ||
                        data.some(
                          (r) =>
                            !r.name ||
                            !r.id ||
                            !Number.isFinite(Number(r.price)) ||
                            Number(r.price) < 0,
                        )
                      )
                        throw new Error(
                          "Use a JSON array of up to 500 products with ID, name and non-negative price.",
                        );
                      for (const row of data) {
                        const result = await run(() =>
                          adminService.save("products", {
                            ...newEntity("products", db),
                            ...row,
                            status: "draft",
                          }),
                        );
                        if (!result) return;
                      }
                      toast(`${data.length} products imported as drafts`);
                    } catch (e) {
                      toast(String(e), true);
                    } finally {
                      if (fileInput.current) fileInput.current.value = "";
                    }
                  }}
                />
                <button
                  className="btn"
                  disabled={!editable}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={15} />
                  Import
                </button>
              </>
            )}
            {editable && (
              <button
                className="btn primary"
                onClick={() => setLocalEditor(newEntity(collection, db))}
              >
                <Plus size={16} />
                {collection === "media"
                  ? "Upload media"
                  : `Add ${meta.singular}`}
              </button>
            )}
          </>
        }
      />
      <div className="collection-summary">
        <span>
          <b>{records.length}</b> total {collection}
        </span>
        <span>
          <i className="dot green" />
          {
            records.filter((r) =>
              ["published", "live", "active"].includes(r.status),
            ).length
          }{" "}
          ready
        </span>
        <span>
          <i className="dot amber" />
          {records.filter((r) => r.status === "draft").length} drafts
        </span>
        {collection === "products" && (
          <Link to="/admin/categories">
            <Folder size={14} />
            Manage categories
            <ArrowIcon />
          </Link>
        )}
      </div>
      <div className="collection-tabs">
        <div>
          {(collection === "media"
            ? ["all", "image", "video", "youtube", "in-use", "unused"]
            : collection === "campaigns"
              ? ["all", "live", "scheduled", "draft", "paused", "expired"]
              : ["all", "published", "draft", "archived"]
          ).map((tab) => (
            <button
              key={tab}
              className={filter === tab ? "active" : ""}
              onClick={() => setFilter(tab)}
            >
              {tab === "all" ? "All " + collection : tab.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            aria-label="Grid view"
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            aria-label="List view"
            className={!grid ? "active" : ""}
            onClick={() => setGrid(false)}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      {grid ? (
        <>
          <div className="grid-filters">
            <input
              aria-label={`Search ${collection}`}
              placeholder={`Search ${collection}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span>{filtered.length} items</span>
          </div>
          <div className="content-card-grid">
            {filtered.map((row) => (
              <article
                className={`content-card ${collection}-card`}
                key={row.id}
              >
                {["products", "media", "campaigns"].includes(collection) ? (
                  <button
                    className="content-card-image"
                    onClick={() => setPreview(row)}
                  >
                    <AssetImage
                      src={String(
                        row.image ||
                          row.thumbnail ||
                          row.url ||
                          "/products/hero-laptop.png",
                      )}
                      alt={row.name}
                    />
                    <span className="media-type">
                      {row.type === "video" ? (
                        <Film size={13} />
                      ) : row.type === "youtube" ? (
                        <Youtube size={13} />
                      ) : (
                        <Image size={13} />
                      )}{" "}
                      {collection === "campaigns"
                        ? "CAMPAIGN"
                        : String(row.type || "IMAGE").toUpperCase()}
                    </span>
                    {collection === "campaigns" && (
                      <div className="campaign-card-copy">
                        <span>MERCURY COMPUTERS</span>
                        <strong>{String(row.headline)}</strong>
                        <em>{String(row.subheadline)}</em>
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="entity-card-icon">
                    {collection === "branches" ? <Folder /> : <Tag />}
                  </div>
                )}
                <div className="content-card-info">
                  <div>
                    <h3>{row.name}</h3>
                    {actions(row)}
                  </div>
                  <p>
                    {collection === "media"
                      ? `${String(row.resolution)} · ${(Number(row.size || 0) / 1024 / 1024).toFixed(1)} MB`
                      : collection === "campaigns"
                        ? `${String(row.startDate)} — ${String(row.endDate || "Ongoing")}`
                        : String(row.description || row.address || row.id)}
                  </p>
                  <div className="content-card-footer">
                    <Badge>{row.status}</Badge>
                    <span>
                      {collection === "media"
                        ? `${usage(row.id)} playlists`
                        : collection === "groups"
                          ? `${Array.isArray(row.screenIds) ? row.screenIds.length : 0} screens`
                          : collection === "branches"
                            ? `${db.collections.screens.filter((s) => s.branchId === row.id).length} screens`
                            : "Demo content"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <Empty
              title={`No ${collection} found`}
              description="Clear your search or add a new item."
            />
          )}
        </>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          onRow={(row) => (editable ? setLocalEditor(row) : setPreview(row))}
          actions={actions}
          bulk={bulk}
          searchPlaceholder={`Search ${collection}…`}
          filters={
            collection === "products" ? (
              <>
                <select
                  aria-label="Filter category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {db.collections.categories.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="all">All brands</option>
                  {[...new Set(records.map((r) => String(r.brand)))].map(
                    (b) => (
                      <option key={b}>{b}</option>
                    ),
                  )}
                </select>
                <select
                  aria-label="Filter availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="all">Availability</option>
                  {["in_stock", "limited", "out_of_stock"].map((v) => (
                    <option key={v} value={v}>
                      {v.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  Featured
                </label>
                <select
                  aria-label="Filter campaign"
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                >
                  <option value="all">All campaigns</option>
                  {db.collections.campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter screen visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="all">All screen visibility</option>
                  {db.collections.screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="price-filter"
                  aria-label="Maximum price"
                  placeholder="Max price (UGX)"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </>
            ) : undefined
          }
        />
      )}
      {editor && editable && (
        <EntityEditor
          key={editor.id}
          collection={collection}
          entity={editor}
          onClose={closeEditor}
        />
      )}{" "}
      {remove && (
        <Confirm
          title={`Delete ${remove.length} ${meta.singular}${remove.length > 1 ? "s" : ""}?`}
          description="This removes the draft records. Existing published snapshots remain until you publish again."
          danger
          onClose={() => setRemove(null)}
          onConfirm={() =>
            run(
              () => adminService.remove(collection, remove),
              "Deleted successfully",
            )
          }
        />
      )}
      {preview && (
        <Modal
          wide
          title={`Preview · ${preview.name}`}
          onClose={() => setPreview(null)}
        >
          {["products", "campaigns", "media"].includes(collection) ? (
            <ScreenPreview override={previewOverride} />
          ) : (
            <div className="record-inspector">
              {Object.entries(preview)
                .filter(
                  ([k, v]) =>
                    !["id", "updatedAt"].includes(k) && typeof v !== "object",
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <b>{k}</b>
                    <span>{String(v)}</span>
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}
      {history && (
        <Modal
          title={`Version history · ${history.name}`}
          onClose={() => setHistory(null)}
        >
          <div className="version-list">
            {db.versions
              .filter(
                (v) => v.entityId === history.id && v.collection === collection,
              )
              .map((v, i) => (
                <div key={v.id}>
                  <span>
                    <b>
                      Version{" "}
                      {db.versions.filter((x) => x.entityId === history.id)
                        .length - i}
                    </b>
                    <small>
                      {v.actor} · {new Date(v.time).toLocaleString()}
                    </small>
                  </span>
                  <button
                    className="btn small"
                    onClick={() => setPreview(v.value)}
                  >
                    View
                  </button>
                  <button
                    className="btn small"
                    onClick={() =>
                      run(
                        () => adminService.restore(v.id),
                        "Version restored as a draft",
                      )
                    }
                  >
                    Restore
                  </button>
                </div>
              ))}
          </div>
          {!db.versions.some((v) => v.entityId === history.id) && (
            <Empty
              title="No previous versions"
              description="A snapshot is recorded each time you save a change."
            />
          )}
        </Modal>
      )}
      {assignment && (
        <Modal
          title={
            assignmentKind === "category"
              ? "Change product category"
              : `Assign content to a ${assignmentKind}`
          }
          description="This updates the draft assignment. Publish a new snapshot to apply it to a TV."
          onClose={() => setAssignment(null)}
        >
          <div className="modal-padded">
            <label>
              {assignmentKind}
              <select
                value={assignScreen}
                onChange={(e) => setAssignScreen(e.target.value)}
              >
                <option value="">Choose…</option>
                {db.collections[
                  assignmentKind === "group"
                    ? "groups"
                    : assignmentKind === "category"
                      ? "categories"
                      : "screens"
                ].map((s) => (
                  <option
                    key={s.id}
                    value={assignmentKind === "category" ? s.name : s.id}
                  >
                    {s.name}
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
              disabled={!assignScreen}
              onClick={async () => {
                for (const id of assignment) {
                  const row = records.find((r) => r.id === id)!;
                  await run(() =>
                    adminService.save(collection, {
                      ...row,
                      status: ["products", "media", "campaigns"].includes(
                        collection,
                      )
                        ? "draft"
                        : row.status,
                      ...(assignmentKind === "category"
                        ? { category: assignScreen }
                        : assignmentKind === "group"
                          ? {
                              groupIds: [
                                ...new Set([
                                  ...(Array.isArray(row.groupIds)
                                    ? row.groupIds
                                    : []),
                                  assignScreen,
                                ]),
                              ],
                            }
                          : {
                              screenIds: [
                                ...new Set([
                                  ...(Array.isArray(row.screenIds)
                                    ? row.screenIds
                                    : []),
                                  assignScreen,
                                ]),
                              ],
                            }),
                    }),
                  );
                }
                toast("Draft assignments saved");
                setAssignment(null);
              }}
            >
              Assign content
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ArrowIcon() {
  return <span>↗</span>;
}
