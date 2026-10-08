import { useMemo, useState } from "react";
import {
  Palette,
  RotateCcw,
  Save,
  Check,
  Copy,
  SlidersHorizontal,
  Monitor,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { PageHeading, Modal } from "../components/UI";
import { ScreenPreview } from "../components/ScreenPreview";
import { UnsavedGuard } from "../hooks/useUnsaved";
import { adminService } from "../services/adminService";
import { seedThemes, seedLayouts } from "../data/seed";
import type { SignageTheme, DisplayLayout, Screen } from "../types/models";
function readable(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
function rgb(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
}
function hsl(hex: string) {
  let [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round((h + 360) % 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}
export function ThemeCustomizer({
  typographyOnly = false,
}: {
  typographyOnly?: boolean;
}) {
  const { db, run, toast, can } = useAdmin();
  const [draft, setDraft] = useState<SignageTheme>(
    structuredClone(db.themes[1] || db.themes[0]),
  );
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [apply, setApply] = useState(false);
  const [colorMode, setColorMode] = useState("HEX");
  const [screenId, setScreenId] = useState(db.collections.screens[0]?.id || "");
  const dirty = JSON.stringify(draft) !== saved;
  const override = useMemo(
    () => ({
      themes: db.themes.some((t) => t.id === draft.id)
        ? db.themes.map((t) => (t.id === draft.id ? draft : t))
        : [...db.themes, draft],
      collections: {
        ...db.collections,
        screens: db.collections.screens.map((s) =>
          s.id === screenId
            ? { ...s, config: { ...(s as Screen).config, theme: draft.id } }
            : s,
        ),
      },
    }),
    [db, draft, screenId],
  );
  const save = async () => {
    if (Object.values(draft.colors).some((c) => !/^#[0-9a-fA-F]{6}$/.test(c))) {
      toast("Use valid six-digit HEX colors.", true);
      return false;
    }
    const result = await run(
      () => adminService.saveTheme(draft),
      "Theme draft saved",
    );
    if (result) {
      setSaved(JSON.stringify(draft));
      return true;
    }
    return false;
  };
  const choose = (theme: SignageTheme) => {
    if (dirty) {
      if (!window.confirm("Discard unsaved theme changes and switch presets?"))
        return;
    }
    setDraft(structuredClone(theme));
    setSaved(JSON.stringify(theme));
  };
  return (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>{typographyOnly ? "Typography" : "Signage appearance"}</h2>
          <p>
            Design what customers see. This is separate from your admin
            interface theme.
          </p>
        </div>
        <div>
          <button
            className="btn"
            onClick={() => {
              const original =
                db.themes.find((t) => t.id === draft.id) || seedThemes[0];
              setDraft(structuredClone(original));
              setSaved(JSON.stringify(original));
            }}
          >
            <RotateCcw size={14} />
            Reset changes
          </button>
          <button className="btn" disabled={!can("themes")} onClick={save}>
            <Save size={14} />
            Save theme
          </button>
          <button
            className="btn primary"
            disabled={!can("themes") || !can("publish")}
            onClick={() => setApply(true)}
          >
            <Check size={14} />
            Apply theme
          </button>
        </div>
      </div>
      {!typographyOnly && (
        <div className="theme-presets">
          {db.themes.map((t) => (
            <button
              key={t.id}
              className={draft.id === t.id ? "active" : ""}
              onClick={() => choose(t)}
            >
              <div
                className="theme-swatch-preview"
                style={{ background: t.colors.background }}
              >
                <span style={{ background: t.colors.headerBackground }} />
                <div>
                  <i style={{ background: t.colors.sidebarBackground }} />
                  <b style={{ background: t.colors.surface }}>
                    <em style={{ background: t.colors.accent }} />
                  </b>
                </div>
                <span style={{ background: t.colors.tickerBackground }} />
              </div>
              <strong>
                {t.name}
                {draft.id === t.id && <Check size={14} />}
              </strong>
              <span>
                {Object.values(t.colors)
                  .slice(0, 4)
                  .map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
              </span>
            </button>
          ))}
          <button
            className="custom-theme-card"
            onClick={() => {
              const custom = {
                ...structuredClone(draft),
                id: `custom-${Date.now().toString(36)}`,
                name: "Custom Mercury",
              };
              setDraft(custom);
              setSaved("");
            }}
          >
            <Palette />
            <strong>Create custom</strong>
            <small>Your own signature look</small>
          </button>
        </div>
      )}
      <div className="appearance-editor">
        <section className="panel color-editor">
          <div className="panel-heading">
            <h3>{typographyOnly ? "Typography settings" : "Theme controls"}</h3>
            <SlidersHorizontal size={16} />
          </div>
          <div className="modal-padded">
            <label>
              Theme name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            {!typographyOnly && (
              <>
                <div className="color-format">
                  <span>COLOR VALUES</span>
                  <select
                    aria-label="Color format"
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                  >
                    {["HEX", "RGB", "HSL"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                {Object.entries(draft.colors).map(([key, value]) => (
                  <div className="color-field" key={key}>
                    <label htmlFor={`color-${key}`}>{readable(key)}</label>
                    <div>
                      <input
                        aria-label={`${readable(key)} picker`}
                        type="color"
                        value={
                          /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"
                        }
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            colors: { ...draft.colors, [key]: e.target.value },
                          })
                        }
                      />
                      <input
                        id={`color-${key}`}
                        aria-label={`${readable(key)} value`}
                        key={colorMode + value}
                        defaultValue={
                          colorMode === "RGB"
                            ? rgb(value).join(", ")
                            : colorMode === "HSL"
                              ? hsl(value)
                              : value
                        }
                        onBlur={(e) => {
                          let hex = e.target.value.trim();
                          if (colorMode === "RGB") {
                            const a = hex.split(/[, ]+/).map(Number);
                            if (
                              a.length !== 3 ||
                              a.some(
                                (v) => !Number.isFinite(v) || v < 0 || v > 255,
                              )
                            ) {
                              toast(
                                "RGB needs three values from 0 to 255.",
                                true,
                              );
                              return;
                            }
                            hex =
                              "#" +
                              a
                                .map((v) =>
                                  Math.round(v).toString(16).padStart(2, "0"),
                                )
                                .join("");
                          }
                          if (colorMode === "HSL") {
                            const a = hex
                              .replaceAll("%", "")
                              .split(/[, ]+/)
                              .map(Number);
                            if (
                              a.length !== 3 ||
                              a[0] < 0 ||
                              a[0] > 360 ||
                              a.slice(1).some((v) => v < 0 || v > 100)
                            ) {
                              toast("Use H 0–360, S 0–100%, L 0–100%.", true);
                              return;
                            }
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d")!;
                            ctx.fillStyle = `hsl(${a[0]} ${a[1]}% ${a[2]}%)`;
                            ctx.fillRect(0, 0, 1, 1);
                            hex =
                              "#" +
                              Array.from(ctx.getImageData(0, 0, 1, 1).data)
                                .slice(0, 3)
                                .map((v) => v.toString(16).padStart(2, "0"))
                                .join("");
                          }
                          if (!/^#[0-9a-f]{6}$/i.test(hex)) {
                            toast("Enter a valid six-digit HEX color.", true);
                            return;
                          }
                          setDraft({
                            ...draft,
                            colors: { ...draft.colors, [key]: hex },
                          });
                        }}
                      />
                      <button
                        className="icon-button"
                        aria-label={`Copy ${readable(key)} HEX`}
                        onClick={() =>
                          navigator.clipboard
                            .writeText(value)
                            .then(() => toast("HEX copied"))
                            .catch(() => toast("Clipboard unavailable", true))
                        }
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            <h3 className="form-subheading">Typography</h3>
            {(["headingFont", "bodyFont"] as const).map((key) => (
              <label key={key}>
                {readable(key)}
                <select
                  value={draft.typography[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...draft.typography,
                        [key]: e.target.value,
                      },
                    })
                  }
                >
                  {["Arial", "Inter", "Manrope", "Montserrat", "DM Sans"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
            ))}
            {(["headingWeight", "priceWeight"] as const).map((key) => (
              <label key={key}>
                {readable(key)}
                <select
                  value={draft.typography[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...draft.typography,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                >
                  {[400, 500, 600, 700, 750, 800, 900].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Base font scaling
              <select
                value={draft.typography.scale}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    typography: { ...draft.typography, scale: e.target.value },
                  })
                }
              >
                {["Small", "Default", "Large", "Extra Large"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            {!typographyOnly && (
              <>
                {(
                  [
                    {
                      key: "borderRadius",
                      values: ["Square", "Small", "Medium", "Large"],
                    },
                    {
                      key: "shadowIntensity",
                      values: ["None", "Low", "Medium", "High"],
                    },
                    {
                      key: "animationStyle",
                      values: ["Fade", "Slide", "Crossfade", "Smooth Zoom"],
                    },
                    {
                      key: "animationSpeed",
                      values: ["Slow", "Normal", "Fast"],
                    },
                  ] as const
                ).map((field) => (
                  <label key={field.key}>
                    {readable(field.key)}
                    <select
                      value={draft[field.key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [field.key]: e.target.value })
                      }
                    >
                      {field.values.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <button
                  className="text-button"
                  onClick={() =>
                    setDraft({
                      ...structuredClone(seedThemes[0]),
                      id: draft.id,
                      name: draft.name,
                    })
                  }
                >
                  Restore Mercury defaults
                </button>
              </>
            )}
          </div>
        </section>
        <div className="appearance-preview">
          <div className="preview-context">
            <span>
              <i className="dot green" />
              LIVE THEME PREVIEW
            </span>
            <select
              aria-label="Theme preview screen"
              value={screenId}
              onChange={(e) => setScreenId(e.target.value)}
            >
              {db.collections.screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ScreenPreview screenId={screenId} override={override} />
          <div className="preview-caption">
            <Monitor size={17} />
            <span>
              This is the actual Mercury TV renderer.
              <small>
                Changes appear here immediately. Screens keep their published
                theme until you apply.
              </small>
            </span>
          </div>
          <div className="theme-token-card">
            <h3>{draft.name}</h3>
            <p>
              {draft.typography.headingFont} · {draft.typography.scale} scale ·{" "}
              {draft.animationStyle}
            </p>
            <span className="unsaved-label">
              {dirty ? "● Unsaved changes" : "✓ Saved theme"}
            </span>
          </div>
        </div>
      </div>
      <UnsavedGuard dirty={dirty} onSave={save} />
      {apply && (
        <ApplyAppearance
          title={`Apply ${draft.name}`}
          onClose={() => setApply(false)}
          beforeApply={save}
          patch={{ theme: draft.id }}
        />
      )}
    </>
  );
}
export function ApplyAppearance({
  title,
  onClose,
  beforeApply,
  patch,
}: {
  title: string;
  onClose: () => void;
  beforeApply: () => Promise<boolean>;
  patch: { theme?: string; layout?: string };
}) {
  const { db, run } = useAdmin();
  const [target, setTarget] = useState("all");
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const ids =
    target === "all"
      ? db.collections.screens.map((s) => s.id)
      : target === "group"
        ? db.collections.screens
            .filter((s) => s.groupId === id)
            .map((s) => s.id)
        : [id].filter(Boolean);
  return (
    <Modal
      title={title}
      description="Review the preview, then publish the saved appearance to the selected screens."
      onClose={onClose}
    >
      <div className="modal-padded">
        <label>
          Apply to
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setId("");
            }}
          >
            <option value="all">All screens</option>
            <option value="group">Screen group</option>
            <option value="screen">Specific screen</option>
          </select>
        </label>
        {target !== "all" && (
          <label>
            {target === "group" ? "Screen group" : "Screen"}
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">Choose…</option>
              {(target === "group"
                ? db.collections.groups
                : db.collections.screens
              ).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="form-hint">
          {ids.length} screen configurations will be updated. This is a
          browser-local publish simulation.
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!ids.length || busy}
          onClick={async () => {
            setBusy(true);
            if (await beforeApply()) {
              const result = await run(
                () => adminService.applyAppearance(ids, patch),
                "Appearance published to screens",
              );
              if (result) onClose();
            }
            setBusy(false);
          }}
        >
          Apply & publish
        </button>
      </div>
    </Modal>
  );
}
export function LayoutsPage() {
  const { db, can, run } = useAdmin();
  const [draft, setDraft] = useState<DisplayLayout>(
    structuredClone(db.layouts[0]),
  );
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [apply, setApply] = useState(false);
  const dirty = JSON.stringify(draft) !== saved;
  const override = useMemo(
    () => ({
      layouts: db.layouts.map((l) => (l.id === draft.id ? draft : l)),
      collections: {
        ...db.collections,
        screens: db.collections.screens.map((s, i) =>
          i === 0
            ? { ...s, config: { ...(s as Screen).config, layout: draft.id } }
            : s,
        ),
      },
    }),
    [db, draft],
  );
  const save = async () => {
    if (
      draft.headerHeight + draft.tickerHeight > 45 ||
      draft.sidebarWidth > 55
    ) {
      return false;
    }
    const result = await run(
      () => adminService.saveLayout(draft),
      "Layout draft saved",
    );
    if (result) {
      setSaved(JSON.stringify(draft));
      return true;
    }
    return false;
  };
  return (
    <>
      <PageHeading
        eyebrow="DISPLAY DESIGN"
        title="Layouts"
        description="Give every screen the right balance of products, media, and information."
        actions={
          <>
            <button className="btn" disabled={!can("themes")} onClick={save}>
              <Save size={15} />
              Save Draft
            </button>
            <button
              className="btn primary"
              disabled={!can("themes") || !can("publish")}
              onClick={() => setApply(true)}
            >
              Apply layout
            </button>
          </>
        }
      />
      <div className="layout-presets">
        {db.layouts.map((l) => (
          <button
            key={l.id}
            className={draft.id === l.id ? "active" : ""}
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved layout changes?"))
                return;
              setDraft(structuredClone(l));
              setSaved(JSON.stringify(l));
            }}
          >
            <div className="layout-wireframe">
              {l.headerEnabled && <header />}
              <div>
                {l.sidebarEnabled && (
                  <aside style={{ width: l.sidebarWidth + "%" }} />
                )}
                <main />
              </div>
              {l.tickerEnabled && <footer />}
            </div>
            <b>{l.name}</b>
          </button>
        ))}
      </div>
      <div className="appearance-editor">
        <section className="panel layout-controls">
          <h2>Layout zones</h2>
          {(
            [
              {
                enabled: "headerEnabled",
                label: "Top brand bar",
                field: "headerHeight",
                max: 20,
              },
              {
                enabled: "sidebarEnabled",
                label: "Product sidebar",
                field: "sidebarWidth",
                max: 55,
              },
              {
                enabled: "tickerEnabled",
                label: "Bottom ticker",
                field: "tickerHeight",
                max: 25,
              },
            ] as const
          ).map((c) => (
            <div className="zone-control" key={c.enabled}>
              <label className="setting-toggle">
                <b>{c.label}</b>
                <input
                  type="checkbox"
                  checked={draft[c.enabled]}
                  onChange={(e) =>
                    setDraft({ ...draft, [c.enabled]: e.target.checked })
                  }
                />
              </label>
              <label>
                {c.field === "sidebarWidth" ? "Width" : "Height"}{" "}
                <b>{draft[c.field]}%</b>
                <input
                  type="range"
                  min="5"
                  max={c.max}
                  value={draft[c.field]}
                  onChange={(e) =>
                    setDraft({ ...draft, [c.field]: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          ))}
          <label>
            Logo size
            <input
              type="range"
              min="8"
              max="25"
              value={draft.logoSize}
              onChange={(e) =>
                setDraft({ ...draft, logoSize: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Media fit
            <select
              value={draft.mediaFit}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  mediaFit: e.target.value as "cover" | "contain",
                })
              }
            >
              <option>cover</option>
              <option>contain</option>
            </select>
          </label>
          <label>
            Clock position
            <select
              value={draft.clockPosition}
              onChange={(e) =>
                setDraft({ ...draft, clockPosition: e.target.value })
              }
            >
              <option>right</option>
              <option>left</option>
            </select>
          </label>
          <label className="setting-toggle">
            <span>Company information</span>
            <input
              type="checkbox"
              checked={draft.companyInfoEnabled}
              onChange={(e) =>
                setDraft({ ...draft, companyInfoEnabled: e.target.checked })
              }
            />
          </label>
          <button
            className="text-button"
            onClick={() =>
              setDraft(
                structuredClone(seedLayouts.find((l) => l.id === draft.id)!),
              )
            }
          >
            Restore preset defaults
          </button>
        </section>
        <div className="appearance-preview">
          <ScreenPreview override={override} />
          <div className="preview-caption">
            Zones scale proportionally with the television viewport.
          </div>
        </div>
      </div>
      <UnsavedGuard dirty={dirty} onSave={save} />
      {apply && (
        <ApplyAppearance
          title={`Apply ${draft.name}`}
          onClose={() => setApply(false)}
          beforeApply={save}
          patch={{ layout: draft.id }}
        />
      )}
    </>
  );
}
