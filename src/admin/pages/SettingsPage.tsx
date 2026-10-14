import { supabaseEnabled } from "../../utils/supabase/client";
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { PageHeading, Confirm } from "../components/UI";
import { ThemeCustomizer } from "./AppearancePage";
import { ScreenPreview } from "../components/ScreenPreview";
import { UnsavedGuard } from "../hooks/useUnsaved";
import { adminService, setSimulateFailure } from "../services/adminService";
import { downloadJSON } from "../utils/export";
import { storeAsset } from "../services/assetService";
import type { Settings } from "../types/models";
const tabs = [
  "Company",
  "Signage",
  "Appearance",
  "Typography",
  "Branding",
  "Media",
  "Screens",
  "Notifications",
  "Users & Security",
  "API",
  "Storage",
  "System",
];
const sections: Record<
  string,
  { key: string; label: string; type?: string; options?: string[] }[]
> = {
  Company: [
    { key: "companyName", label: "Company name" },
    { key: "website", label: "Website" },
    {
      key: "currency",
      label: "Default currency",
      options: ["UGX", "USD", "KES"],
    },
    {
      key: "timezone",
      label: "Timezone",
      options: ["Africa/Kampala", "Africa/Nairobi", "UTC"],
    },
    { key: "tagline", label: "Brand tagline" },
    { key: "phone", label: "Phone number" },
    { key: "email", label: "Company email", type: "email" },
    { key: "address", label: "Address" },
  ],
  Signage: [
    {
      key: "featuredRotation",
      label: "Featured product rotation (ms)",
      type: "number",
    },
    { key: "tickerRotation", label: "Ticker rotation (ms)", type: "number" },
    {
      key: "campaignRotation",
      label: "Campaign rotation (ms)",
      type: "number",
    },
    { key: "showClock", label: "Show clock by default", type: "checkbox" },
    { key: "showPrices", label: "Show prices by default", type: "checkbox" },
    { key: "muted", label: "Mute videos by default", type: "checkbox" },
    { key: "preload", label: "Preload upcoming content", type: "checkbox" },
  ],
  Branding: [
    { key: "logo", label: "Primary Mercury logo" },
    { key: "lightLogo", label: "Light logo" },
    { key: "darkLogo", label: "Dark logo" },
    { key: "loadingLogo", label: "Loading screen logo" },
    { key: "favicon", label: "Favicon" },
    { key: "tagline", label: "Brand tagline" },
  ],
  Media: [
    { key: "maxImageSize", label: "Maximum image size (MB)", type: "number" },
    { key: "maxVideoSize", label: "Maximum video size (MB)", type: "number" },
    {
      key: "imageDuration",
      label: "Default image duration (seconds)",
      type: "number",
    },
    { key: "muted", label: "Mute video by default", type: "checkbox" },
    { key: "preload", label: "Preload media", type: "checkbox" },
  ],
  Notifications: [
    {
      key: "notificationScreens",
      label: "Screen status notifications",
      type: "checkbox",
    },
    {
      key: "notificationEmail",
      label: "Email notifications (future backend)",
      type: "checkbox",
    },
  ],
  API: [{ key: "apiBaseUrl", label: "API base URL (draft configuration)" }],
  System: [
    {
      key: "autoBackup",
      label: "Automatic backup (future backend)",
      type: "checkbox",
    },
    {
      key: "backupFrequency",
      label: "Backup frequency",
      options: ["Daily", "Weekly", "Monthly"],
    },
  ],
};
export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab") || "")
    ? params.get("tab")!
    : "Company";
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE CONFIGURATION"
        title="Settings"
        description="Make Mercury’s display network work your way."
      />
      <div className="settings-tabs">
        {tabs.map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setParams({ tab: t })}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Appearance" ? (
        <ThemeCustomizer />
      ) : tab === "Typography" ? (
        <ThemeCustomizer typographyOnly />
      ) : (
        <GeneralSettings key={tab} tab={tab} />
      )}
    </>
  );
}
function GeneralSettings({ tab }: { tab: string }) {
  const { db, run, toast, can } = useAdmin();
  const [draft, setDraft] = useState<Settings>(structuredClone(db.settings));
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [reset, setReset] = useState(false);
  const [connection, setConnection] = useState("");
  const [failure, setFailure] = useState(false);
  const dirty = JSON.stringify(draft) !== saved;
  const save = async () => {
    if (!draft.companyName.trim()) {
      toast("Company name is required.", true);
      return false;
    }
    if (
      ["featuredRotation", "tickerRotation", "campaignRotation"].some(
        (k) => Number(draft[k]) < 1000,
      )
    ) {
      toast("Rotation must be at least 1,000 ms.", true);
      return false;
    }
    if (draft.apiBaseUrl && !/^https?:\/\//.test(draft.apiBaseUrl)) {
      toast("API URL must start with HTTP or HTTPS.", true);
      return false;
    }
    const result = await run(
      () => adminService.saveSettings(draft),
      "Settings draft saved",
    );
    if (result) {
      setSaved(JSON.stringify(draft));
      return true;
    }
    return false;
  };
  return (
    <>
      <div className="settings-section-heading">
        <div>
          <h2>{tab} settings</h2>
          <p>
            {supabaseEnabled
              ? "Changes are saved to your shared workspace. Publish to screens to update TV content."
              : tab === "API"
                ? "The active API adapter is selected with VITE_API_BASE_URL at build time."
                : "Changes are saved locally. Publish a screen configuration to update TV content."}
          </p>
        </div>
        <button
          className="btn primary"
          disabled={!can("settings")}
          onClick={save}
        >
          <Save size={15} />
          Save changes
        </button>
      </div>
      <div className="settings-content-grid">
        <section className="panel general-settings-form">
          {(sections[tab] || []).map((field) => (
            <label
              key={field.key}
              className={field.type === "checkbox" ? "setting-toggle" : ""}
            >
              <span>{field.label}</span>
              {field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!draft[field.key]}
                  disabled={!can("settings")}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.checked })
                  }
                />
              ) : field.options ? (
                <select
                  value={String(draft[field.key])}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                >
                  {field.options.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  min={field.type === "number" ? 1 : undefined}
                  value={String(draft[field.key])}
                  disabled={!can("settings")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [field.key]:
                        field.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}
          {tab === "Branding" && (
            <label className="upload-zone">
              <Upload />
              <b>Upload primary logo</b>
              <input
                aria-label="Upload primary logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 10 * 1024 * 1024 ||
                    !/^image\/(png|jpeg|webp)$/.test(file.type)
                  ) {
                    toast("Choose a PNG, JPG or WebP under 10 MB.", true);
                    return;
                  }
                  try {
                    const logo = await storeAsset(file);
                    setDraft({ ...draft, logo });
                  } catch (e) {
                    toast(String(e), true);
                  }
                }}
              />
            </label>
          )}
          {tab === "API" && (
            <>
              <div className="form-hint">
                No private keys belong in frontend settings. Production
                authentication uses your server’s session cookies, CSRF
                protection and access checks.
              </div>
              <button
                className="btn"
                onClick={() => {
                  setConnection("Testing…");
                  setTimeout(
                    () =>
                      setConnection(
                        draft.apiBaseUrl
                          ? "Simulated connection successful — no remote request was made."
                          : "Mock adapter connected. Set VITE_API_BASE_URL to enable a real backend.",
                      ),
                    600,
                  );
                }}
              >
                Test connection
              </button>
              {connection && (
                <div role="status" className="connection-result">
                  <CheckCircle2 size={17} />
                  {connection}
                </div>
              )}
            </>
          )}
          {tab === "Screens" && (
            <>
              <h3>Screen defaults & pairing</h3>
              <p>
                Screen identity, resolution, orientation, playlist and theme are
                configured for each display.
              </p>
              <Link className="btn" to="/admin/screens?new=1">
                Register a new screen
              </Link>
              <div className="pairing-example">
                <span>PAIR THIS SCREEN</span>
                <b>832741</b>
                <small>
                  Demo pairing code · actual handshakes require the future
                  device service.
                </small>
              </div>
            </>
          )}
          {tab === "Users & Security" && (
            <>
              <h3>Access and sessions</h3>
              <p>
                {supabaseEnabled
                  ? "Sign-in is connected. User roles control access across the workspace."
                  : "This development workspace uses browser-local sessions that expire after eight hours."}
              </p>
              <Link className="btn" to="/admin/users">
                Manage users
              </Link>
              <Link className="btn" to="/admin/roles">
                Roles & permissions
              </Link>
              <div className="form-hint">
                {supabaseEnabled
                  ? "Manage accounts, assign roles, or disable access from Users. Passwords are never included in configuration exports."
                  : "Demo permissions are for preview only."}
              </div>
            </>
          )}
          {tab === "Storage" && (
            <>
              <h3>
                {supabaseEnabled
                  ? "Shared media storage"
                  : "Browser media storage"}
              </h3>
              <p>
                {supabaseEnabled
                  ? "Uploads are saved to shared storage and available to your displays."
                  : "Uploads are stored in this browser and are not shared across devices."}
              </p>
              <div className="storage-meter">
                <span style={{ width: "28%" }} />
              </div>
              <div className="storage-details">
                <b>
                  {(
                    db.collections.media.reduce(
                      (n, m) => n + Number(m.size || 0),
                      0,
                    ) /
                    1024 /
                    1024
                  ).toFixed(1)}{" "}
                  MB
                </b>
                <span>Referenced demo media and local assets</span>
              </div>
              <p>
                Quota is managed by your browser. Deleting site data removes
                local uploads. Configuration exports contain asset references,
                not the media files.
              </p>
            </>
          )}
          {tab === "System" && (
            <>
              <div className="form-hint">
                Backups are configuration exports in this frontend. Automated
                server backups are not connected.
              </div>
              <button
                className="btn"
                onClick={() =>
                  downloadJSON(
                    db,
                    `mercury-backup-${new Date().toISOString().slice(0, 10)}.json`,
                  )
                }
              >
                <Download size={15} />
                Export configuration backup
              </button>
              {import.meta.env.DEV && !supabaseEnabled && (
                <div className="developer-tools">
                  <h3>Development tools</h3>
                  <label className="setting-toggle">
                    <span>Simulate API failure on next query</span>
                    <input
                      type="checkbox"
                      checked={failure}
                      onChange={(e) => {
                        setFailure(e.target.checked);
                        setSimulateFailure(e.target.checked);
                        toast(
                          e.target.checked
                            ? "Failure simulation enabled for next load"
                            : "Failure simulation disabled",
                        );
                      }}
                    />
                  </label>
                  <button className="btn danger" onClick={() => setReset(true)}>
                    <RotateCcw size={14} />
                    Reset mock data
                  </button>
                </div>
              )}
            </>
          )}
          {tab === "Media" && (
            <div className="form-hint">
              Supported images: PNG, JPG, JPEG, WebP. Videos: MP4, WebM. YouTube
              links are validated in the Media Library.
            </div>
          )}
          <span className="unsaved-label">
            {dirty ? "● Unsaved changes" : "✓ Saved settings"}
          </span>
        </section>
        <aside>
          {["Branding", "Company", "Signage"].includes(tab) ? (
            <ScreenPreview override={{ settings: draft }} />
          ) : (
            <section className="panel settings-explainer">
              <AlertCircle />
              <h3>Built for your next chapter</h3>
              <p>
                The service layer keeps your interface independent from the
                backend. Connect REST, Supabase, Firebase, or your own server
                when it’s ready.
              </p>
              <Link to="/admin/help">Read the integration guide →</Link>
            </section>
          )}
        </aside>
      </div>
      <UnsavedGuard dirty={dirty} onSave={save} />
      {reset && (
        <Confirm
          danger
          title="Reset the demo workspace?"
          description="This removes all local records and published snapshots, then restores sample data. Export a configuration backup first if needed."
          onClose={() => setReset(false)}
          onConfirm={() =>
            run(() => adminService.reset(), "Demo workspace reset")
          }
        />
      )}
    </>
  );
}
