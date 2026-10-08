import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize, ExternalLink } from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { compileScreen } from "../services/configCompiler";
import type { Database, Screen, PublishedScreen } from "../types/models";
export function ScreenPreview({
  screenId,
  override,
  published = false,
  controls = true,
}: {
  screenId?: string;
  override?: Partial<Database>;
  published?: boolean;
  controls?: boolean;
}) {
  const { db } = useAdmin();
  const token = useRef(crypto.randomUUID()).current;
  const iframe = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [resolution, setResolution] = useState("1920");
  const screen = ((override?.collections || db.collections).screens.find(
    (s) => s.id === screenId,
  ) || (override?.collections || db.collections).screens[0]) as
    Screen | undefined;
  const snapshot = useMemo<PublishedScreen | undefined>(
    () =>
      screen
        ? published
          ? db.published[screen.id]
          : compileScreen({ ...db, ...override }, screen, true)
        : undefined,
    [db, override, published, screen],
  );
  useEffect(() => {
    if (snapshot)
      localStorage.setItem(
        `mercury-preview:${token}`,
        JSON.stringify(snapshot),
      );
  }, [snapshot, token]);
  useEffect(
    () => () => {
      localStorage.removeItem(`mercury-preview:${token}`);
    },
    [token],
  );
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / Number(resolution)),
    );
    if (wrap.current) observer.observe(wrap.current);
    return () => observer.disconnect();
  }, [resolution]);
  if (!screen) return <p>Register a screen to preview.</p>;
  return (
    <div className="screen-preview">
      {controls && (
        <div className="preview-toolbar">
          <span>
            <i />
            {published ? "PUBLISHED DISPLAY" : "DRAFT PREVIEW"}
          </span>
          <select
            aria-label="Preview resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="1920">1080p TV</option>
            <option value="3840">4K TV</option>
            <option value="1366">Desktop</option>
          </select>
          <button
            className="icon-button"
            aria-label="Fullscreen preview"
            onClick={() => iframe.current?.requestFullscreen().catch(() => {})}
          >
            <Maximize />
          </button>
          <a
            className="icon-button"
            aria-label="Open TV in new tab"
            href={`/?screen=${screen.id}&mode=display`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink />
          </a>
        </div>
      )}
      <div className="preview-viewport" ref={wrap}>
        <iframe
          ref={iframe}
          title="Mercury TV preview"
          src={`/?preview=${token}&mode=display`}
          style={{
            width: Number(resolution),
            height: (Number(resolution) * 9) / 16,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}
