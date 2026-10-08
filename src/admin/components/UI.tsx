import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  ArrowUpRight,
  Monitor,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { assetUrl } from "../services/assetService";
import type { Entity } from "../types/models";
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const text = String(children);
  return (
    <span
      className={`badge badge-${tone || text.toLowerCase().replace(/ /g, "-")}`}
    >
      <i />
      {children}
    </span>
  );
}
export function PageHeading({
  eyebrow = "WORKSPACE",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "Add your first item to get started.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Monitor />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`admin-modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
    >
      <div className="modal-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onClose,
  onConfirm,
  danger = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      description={description}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="modal-footer">
        <button className="btn" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className={`btn ${danger ? "danger" : "primary"}`}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
export function AssetImage({
  src,
  alt,
  className = "",
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [url, setUrl] = useState(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    assetUrl(src)
      .then((v) => {
        if (active) setUrl(v);
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
    };
  }, [src]);
  return failed || !url ? (
    <div className={`asset-placeholder ${className}`}>
      <Monitor />
    </div>
  ) : (
    <img
      className={className}
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
export function StatCard({
  label,
  value,
  change,
  icon,
  warning = false,
}: {
  label: string;
  value: string | number;
  change: string;
  icon: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={warning ? "stat-icon warning" : "stat-icon"}>
          {icon}
        </span>
      </div>
      <strong>{value}</strong>
      <div className={warning ? "stat-change warning" : "stat-change"}>
        {!warning && <ArrowUpRight size={13} />} {change}
      </div>
    </div>
  );
}
export interface Column {
  key: string;
  label: string;
  render?: (row: Entity) => ReactNode;
}
export function DataTable({
  rows,
  columns,
  onRow,
  actions,
  bulk,
  filters,
  searchPlaceholder = "Search…",
}: {
  rows: Entity[];
  columns: Column[];
  onRow?: (row: Entity) => void;
  actions?: (row: Entity) => ReactNode;
  bulk?: (ids: string[], clear: () => void) => ReactNode;
  filters?: ReactNode;
  searchPlaceholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: "", direction: 1 });
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showColumns, setShowColumns] = useState(false);
  const filtered = rows
    .filter((r) =>
      [r.name, r.id, r.category, r.brand, r.status, r.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (!sort.key) return 0;
      const x = a[sort.key],
        y = b[sort.key];
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x ?? "").localeCompare(String(y ?? ""))) * sort.direction
      );
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const activePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(activePage * 8, activePage * 8 + 8);
  const selectedIds = selected.filter((id) => rows.some((r) => r.id === id));
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((v) => v !== id) : [...s, id],
    );
  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
          />
        </label>
        {filters}
        <div className="column-control">
          <button
            className="btn small"
            onClick={() => setShowColumns((v) => !v)}
          >
            <SlidersHorizontal size={14} />
            Columns
          </button>
          {showColumns && (
            <div className="popover">
              {columns.map((c) => (
                <label key={c.key}>
                  <input
                    type="checkbox"
                    checked={!hidden.includes(c.key)}
                    onChange={() =>
                      setHidden((h) =>
                        h.includes(c.key)
                          ? h.filter((k) => k !== c.key)
                          : [...h, c.key],
                      )
                    }
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <Check size={15} />
          <b>{selectedIds.length} selected</b>
          {bulk?.(selectedIds, () => setSelected([]))}
          <button className="text-button" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="check-cell">
                <input
                  type="checkbox"
                  aria-label="Select visible rows"
                  checked={
                    visible.length > 0 &&
                    visible.every((r) => selectedIds.includes(r.id))
                  }
                  onChange={() =>
                    setSelected(
                      visible.every((r) => selectedIds.includes(r.id))
                        ? selectedIds.filter(
                            (id) => !visible.some((r) => r.id === id),
                          )
                        : [
                            ...new Set([
                              ...selectedIds,
                              ...visible.map((r) => r.id),
                            ]),
                          ],
                    )
                  }
                />
              </th>
              {columns
                .filter((c) => !hidden.includes(c.key))
                .map((c) => (
                  <th key={c.key}>
                    <button
                      onClick={() =>
                        setSort((s) => ({
                          key: c.key,
                          direction: s.key === c.key ? -s.direction : 1,
                        }))
                      }
                    >
                      {c.label}
                      <ArrowUpDown size={11} />
                    </button>
                  </th>
                ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    aria-label={`Select ${row.name}`}
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                </td>
                {columns
                  .filter((c) => !hidden.includes(c.key))
                  .map((c, i) => (
                    <td key={c.key}>
                      {i === 0 && onRow ? (
                        <button
                          className="table-link"
                          onClick={() => onRow(row)}
                        >
                          {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                        </button>
                      ) : c.render ? (
                        c.render(row)
                      ) : (
                        String(row[c.key] ?? "—")
                      )}
                    </td>
                  ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <Empty
          title="No matching results"
          description="Try another search or clear your filters."
        />
      )}
      <div className="table-pagination">
        <span>
          Showing {filtered.length ? activePage * 8 + 1 : 0}–
          {Math.min((activePage + 1) * 8, filtered.length)} of {filtered.length}{" "}
          results
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={activePage === 0}
            onClick={() => setPage(activePage - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            Page {activePage + 1} of {totalPages}
          </span>
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={activePage + 1 === totalPages}
            onClick={() => setPage(activePage + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
