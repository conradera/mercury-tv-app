import { AssetImage, Badge, type Column } from "./UI";
import type { Collection, Database } from "../types/models";
import { formatCurrency } from "../../utils/currency";
export function collectionColumns(
  collection: Collection,
  db: Database,
  usage: (id: string) => number,
): Column[] {
  return collection === "products"
    ? [
        {
          key: "name",
          label: "Product",
          render: (r) => (
            <span className="product-table-name">
              <AssetImage src={String(r.image)} alt="" />
              <span>
                <b>{r.name}</b>
                <small>
                  {r.id} · {String(r.brand)}
                </small>
              </span>
            </span>
          ),
        },
        { key: "category", label: "Category" },
        { key: "brand", label: "Brand" },
        {
          key: "price",
          label: "Price",
          render: (r) => (
            <span className="price-cell">
              {formatCurrency(Number(r.price), String(r.currency))}
              {!!r.promotionalPrice && (
                <small>
                  {formatCurrency(
                    Number(r.promotionalPrice),
                    String(r.currency),
                  )}{" "}
                  promo
                </small>
              )}
            </span>
          ),
        },
        {
          key: "availability",
          label: "Availability",
          render: (r) => (
            <Badge>{String(r.availability).replaceAll("_", " ")}</Badge>
          ),
        },
        {
          key: "featured",
          label: "Featured",
          render: (r) => (
            <span className={r.featured ? "featured-tag" : ""}>
              {r.featured ? "★ Featured" : "—"}
            </span>
          ),
        },
        { key: "promotionLabel", label: "Promotion" },
        { key: "displayPriority", label: "Priority" },
        {
          key: "updatedAt",
          label: "Updated",
          render: (r) => new Date(r.updatedAt).toLocaleDateString(),
        },
        {
          key: "status",
          label: "Status",
          render: (r) => <Badge>{r.status}</Badge>,
        },
      ]
    : collection === "users"
      ? [
          {
            key: "name",
            label: "Name",
            render: (r) => (
              <span className="user-table-name">
                <span className="avatar">{r.name[0]}</span>
                <span>
                  <b>{r.name}</b>
                  <small>{String(r.email)}</small>
                </span>
              </span>
            ),
          },
          {
            key: "roleId",
            label: "Role",
            render: (r) =>
              db.collections.roles.find((role) => role.id === r.roleId)?.name,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "lastLogin",
            label: "Last login",
            render: (r) =>
              r.lastLogin
                ? new Date(String(r.lastLogin)).toLocaleString()
                : "Never",
          },
        ]
      : collection === "media"
        ? [
            {
              key: "name",
              label: "Asset",
              render: (r) => (
                <span className="product-table-name">
                  <AssetImage src={String(r.thumbnail || r.url)} alt="" />
                  <b>{r.name}</b>
                </span>
              ),
            },
            { key: "type", label: "Type" },
            { key: "resolution", label: "Resolution" },
            {
              key: "duration",
              label: "Duration",
              render: (r) => `${r.duration}s`,
            },
            {
              key: "size",
              label: "Size",
              render: (r) =>
                `${(Number(r.size || 0) / 1024 / 1024).toFixed(1)} MB`,
            },
            {
              key: "status",
              label: "Usage",
              render: (r) => `${usage(r.id)} playlists`,
            },
          ]
        : [
            { key: "name", label: "Name" },
            {
              key:
                collection === "announcements"
                  ? "type"
                  : collection === "branches"
                    ? "code"
                    : "description",
              label:
                collection === "announcements"
                  ? "Type"
                  : collection === "branches"
                    ? "Code"
                    : "Description",
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
            {
              key: "updatedAt",
              label: "Last updated",
              render: (r) => new Date(r.updatedAt).toLocaleDateString(),
            },
          ];
}
