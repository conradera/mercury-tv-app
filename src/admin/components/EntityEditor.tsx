import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Plus, X, Save, Check, AlertTriangle } from "lucide-react";
import { Modal, AssetImage } from "./UI";
import { editorSections, type Field } from "./editorFields";
import { useAdmin } from "../contexts/AdminContext";
import { adminService } from "../services/adminService";
import { storeAsset, inspectFile } from "../services/assetService";
import { youtubeId } from "../../components/signage/YouTubePlayer";
import { UnsavedGuard } from "../hooks/useUnsaved";
import type { Collection, Entity, Screen } from "../types/models";
export function EntityEditor({
  collection,
  entity,
  onClose,
}: {
  collection: Collection;
  entity: Entity;
  onClose: () => void;
}) {
  const { db, run, toast, can } = useAdmin();
  const [closePending, setClosePending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const sections = editorSections(collection, db);
  const schema = z.record(z.string(), z.unknown()).superRefine((data, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (!String(data.name || "").trim()) issue("name", "A name is required.");
    if (!String(data.id || "").trim()) issue("id", "An ID is required.");
    if (
      db.collections[collection].some(
        (r) => r.id === data.id && r.id !== entity.id,
      )
    )
      issue("id", "This ID already exists.");
    if (
      collection === "products" &&
      (!Number.isFinite(Number(data.price)) || Number(data.price) < 0)
    )
      issue("price", "Enter a valid non-negative price.");
    if (Number(data.promotionalPrice) > Number(data.price))
      issue("promotionalPrice", "Promotion must not exceed the regular price.");
    for (const key of ["priority", "displayPriority"])
      if (
        data[key] !== undefined &&
        (Number(data[key]) < 1 || Number(data[key]) > 10)
      )
        issue(key, "Use a value from 1 to 10.");
    for (const key of ["duration", "displayDuration"])
      if (
        data[key] !== undefined &&
        (!Number.isFinite(Number(data[key])) || Number(data[key]) < 1)
      )
        issue(key, "Duration must be at least one second.");
    for (const [start, end] of [
      ["startDate", "endDate"],
      ["displayStart", "displayEnd"],
    ])
      if (data[start] && data[end] && String(data[end]) < String(data[start]))
        issue(end, "End must be after the start.");
    if (
      collection === "schedules" &&
      String(data.endTime) <= String(data.startTime)
    )
      issue("endTime", "End time must be later than start time.");
    if (collection === "schedules" && !data.contentId)
      issue("contentId", "Choose content to schedule.");
    if (
      collection === "media" &&
      data.type === "youtube" &&
      !youtubeId(String(data.url || ""))
    )
      issue("url", "Enter a valid YouTube URL.");
    if (collection === "media" && !data.url)
      issue("url", "Upload a file or enter a media URL.");
    for (const key of ["url", "image"])
      if (data[key] && !/^(https?:\/\/|\/|asset:)/.test(String(data[key])))
        issue(key, "Use an HTTP(S) URL, local path, or uploaded asset.");
    if (collection === "users" && !z.email().safeParse(data.email).success)
      issue("email", "Enter a valid email address.");
    if (collection === "screens" && !/^\d{6}$/.test(String(data.pairingPin)))
      issue("pairingPin", "Use a six-digit pairing PIN.");
    if (collection === "announcements" && !String(data.message || "").trim())
      issue("message", "Enter an announcement message.");
  });
  const screen = collection === "screens" ? (entity as Screen) : undefined;
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...entity,
      ...(screen?.config
        ? { playlist: screen.config.playlist, theme: screen.config.theme }
        : {}),
    },
  });
  const values = form.watch();
  const save = async (publish = false) => {
    let saved = false;
    await form.handleSubmit(async (values) => {
      let status = String(values.status || "draft");
      if (
        [
          "products",
          "media",
          "campaigns",
          "playlists",
          "announcements",
        ].includes(collection)
      )
        status = publish
          ? collection === "campaigns"
            ? "live"
            : "published"
          : "draft";
      const value = {
        ...values,
        id: String(values.id),
        name: String(values.name).trim(),
        status,
        updatedAt: new Date().toISOString(),
      } as Entity;
      if (collection === "products" && value.promotionLabel === "CUSTOM")
        value.promotionLabel = String(
          value.customPromotionLabel || "SPECIAL OFFER",
        );
      if (collection === "media" && value.type === "youtube")
        value.thumbnail = `https://i.ytimg.com/vi/${youtubeId(String(value.url))}/hqdefault.jpg`;
      if (collection === "media" && !value.uploadedBy)
        value.uploadedBy = "Admin";
      if (collection === "screens")
        value.config = {
          ...(screen?.config || {
            layout: "classic",
            featuredProducts: ["P001", "P002", "P003"],
            tickerProducts: ["P004", "P005", "P006"],
            settings: {
              showClock: true,
              showPrices: true,
              featuredRotation: 10000,
              tickerRotation: 8000,
            },
          }),
          screenId: value.id,
          playlist: String(value.playlist),
          theme: String(value.theme),
        };
      const result = await run(
        () => adminService.save(collection, value),
        publish
          ? "Content marked ready. Publish to screens when you’re ready."
          : "Saved successfully",
      );
      if (result) {
        form.reset(value);
        saved = true;
      }
    })();
    return saved;
  };
  const close = () => {
    if (form.formState.isDirty) setClosePending(true);
    else onClose();
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const image = /^image\/(png|jpeg|webp)$/.test(file.type);
    const video = /^video\/(mp4|webm)$/.test(file.type);
    if (!image && !(collection === "media" && video)) {
      toast(
        "Choose a PNG, JPEG or WebP image" +
          (collection === "media" ? ", MP4 or WebM video." : "."),
        true,
      );
      return;
    }
    const limit =
      (image ? db.settings.maxImageSize : db.settings.maxVideoSize) *
      1024 *
      1024;
    if (file.size > limit) {
      toast(
        `File exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`,
        true,
      );
      return;
    }
    setUploading(true);
    setProgress(15);
    try {
      const metadata = await inspectFile(file);
      setProgress(55);
      const asset = await storeAsset(file);
      form.setValue("image", asset, { shouldDirty: true });
      if (collection === "media") {
        form.setValue("url", asset, { shouldDirty: true });
        form.setValue("type", image ? "image" : "video", { shouldDirty: true });
        form.setValue("thumbnail", image ? asset : "/products/hero-laptop.png");
        form.setValue("size", file.size);
        form.setValue("resolution", metadata.resolution);
        form.setValue("duration", metadata.duration);
        if (!values.name)
          form.setValue("name", file.name, { shouldDirty: true });
      }
      setProgress(100);
      toast("File saved to local browser storage");
    } catch (error) {
      toast(String(error), true);
    } finally {
      setUploading(false);
    }
  };
  const renderField = (field: Field) => {
    const value = values[field.key];
    const error = form.formState.errors[field.key]?.message;
    const change = (v: unknown) =>
      form.setValue(field.key, v, { shouldDirty: true, shouldValidate: true });
    return (
      <div
        className={`editor-field ${["textarea", "image", "specs", "multiselect"].includes(field.type || "") ? "span-two" : ""}`}
        key={field.key}
      >
        <label htmlFor={`field-${field.key}`}>{field.label}</label>
        {field.type === "checkbox" ? (
          <label className="switch-label">
            <input
              id={`field-${field.key}`}
              type="checkbox"
              checked={!!value}
              onChange={(e) => change(e.target.checked)}
            />
            <span className="switch-track" />
            <span>{value ? "Enabled" : "Disabled"}</span>
          </label>
        ) : field.type === "select" ? (
          <select
            id={`field-${field.key}`}
            value={String(value || "")}
            onChange={(e) => change(e.target.value)}
          >
            <option value="">Select…</option>
            {field.options?.map((o) => (
              <option value={o.value} key={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : field.type === "multiselect" ? (
          <div className="multi-checks">
            {field.options?.map((o) => (
              <label key={o.value}>
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(o.value)}
                  onChange={(e) =>
                    change(
                      e.target.checked
                        ? [...(Array.isArray(value) ? value : []), o.value]
                        : (Array.isArray(value) ? value : []).filter(
                            (v) => v !== o.value,
                          ),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        ) : field.type === "specs" ? (
          <div className="dynamic-list">
            {(Array.isArray(value) ? value : []).map((v, i) => (
              <div key={i}>
                <input
                  aria-label={`${field.label} ${i + 1}`}
                  value={String(v)}
                  onChange={(e) =>
                    change(
                      (value as string[]).map((old, j) =>
                        i === j ? e.target.value : old,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${field.label} ${i + 1}`}
                  onClick={() =>
                    change((value as string[]).filter((_, j) => i !== j))
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-button"
              onClick={() =>
                change([...(Array.isArray(value) ? value : []), ""])
              }
            >
              <Plus size={14} />
              Add {field.key === "specifications" ? "specification" : "item"}
            </button>
          </div>
        ) : field.type === "image" ? (
          <>
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void upload(e.dataTransfer.files[0]);
              }}
            >
              {value ? (
                <AssetImage src={String(value)} alt="Selected asset" />
              ) : (
                <Upload />
              )}
              <b>Drop your file here, or browse</b>
              <span>
                PNG, JPG, WEBP{collection === "media" ? " · MP4, WEBM" : ""}
              </span>
              <input
                aria-label={field.label}
                type="file"
                accept={
                  collection === "media"
                    ? "image/png,image/jpeg,image/webp,video/mp4,video/webm"
                    : "image/png,image/jpeg,image/webp"
                }
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </div>
            {(uploading || progress > 0) && (
              <progress
                value={progress}
                max="100"
                aria-label="Local upload progress"
              />
            )}
            <input
              placeholder="Or enter an image URL"
              aria-label="Image URL"
              value={String(value || "")}
              onChange={(e) => change(e.target.value)}
            />
          </>
        ) : field.type === "textarea" ? (
          <textarea
            id={`field-${field.key}`}
            rows={3}
            value={String(value || "")}
            onChange={(e) => change(e.target.value)}
          />
        ) : (
          <input
            id={`field-${field.key}`}
            type={field.type || "text"}
            value={String(value ?? "")}
            min={field.min}
            max={field.max}
            disabled={
              field.key === "id" &&
              db.collections[collection].some((r) => r.id === entity.id)
            }
            onChange={(e) =>
              change(
                field.type === "number"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value,
              )
            }
          />
        )}{" "}
        {field.hint && <small className="field-hint">{field.hint}</small>}
        {error && <small className="field-error">{String(error)}</small>}
      </div>
    );
  };
  return (
    <>
      <Modal
        title={`${db.collections[collection].some((r) => r.id === entity.id) ? "Edit" : "Add"} ${collection === "media" ? "media asset" : collection.replace(/ies$/, "y").replace(/s$/, "")}`}
        description="Save your work as a draft. Published TV snapshots stay unchanged until you publish to screens."
        onClose={close}
        wide
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await save(false)) onClose();
          }}
        >
          {values.type === "emergency" && (
            <div className="form-warning">
              <AlertTriangle size={20} />
              Emergency announcements override normal playlists after
              publishing.
            </div>
          )}
          <div className="editor-body">
            {sections.map((section) => (
              <section className="editor-section" key={section.title}>
                <h3>{section.title}</h3>
                <div className="editor-grid">
                  {section.fields.map(renderField)}
                </div>
              </section>
            ))}
          </div>
          <div className="modal-footer">
            <span>
              {uploading
                ? "Saving file…"
                : form.formState.isDirty
                  ? "Unsaved changes"
                  : "All changes saved"}
            </span>
            <button type="button" className="btn" onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={uploading || form.formState.isSubmitting}
            >
              <Save size={15} />
              {["products", "campaigns", "media", "announcements"].includes(
                collection,
              )
                ? "Save Draft"
                : "Save changes"}
            </button>
            {["products", "campaigns", "media", "announcements"].includes(
              collection,
            ) && (
              <button
                type="button"
                className="btn primary"
                disabled={
                  !can("publish") || uploading || form.formState.isSubmitting
                }
                onClick={async () => {
                  if (await save(true)) onClose();
                }}
              >
                <Check size={15} />
                Mark ready to publish
              </button>
            )}
          </div>
        </form>
      </Modal>
      <UnsavedGuard dirty={form.formState.isDirty} onSave={() => save(false)} />
      {closePending && (
        <Modal
          title="You have unsaved changes"
          onClose={() => setClosePending(false)}
        >
          <div className="modal-footer">
            <button className="btn" onClick={() => setClosePending(false)}>
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
    </>
  );
}
