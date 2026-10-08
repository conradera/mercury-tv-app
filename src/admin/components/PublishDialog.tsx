import { useState } from "react";
import { Radio, CheckCircle2 } from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { adminService } from "../services/adminService";
import { Modal, Badge } from "./UI";
export function PublishDialog({
  onClose,
  initialIds,
}: {
  onClose: () => void;
  initialIds?: string[];
}) {
  const { db, run, can } = useAdmin();
  const [ids, setIds] = useState(
    initialIds || db.collections.screens.map((s) => s.id),
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Modal
      title={done ? "Configuration published" : "Review & publish"}
      description={
        done
          ? "The local TV previews now use the new published snapshots."
          : "Publish saved content and settings to selected screens. Draft content is excluded until marked ready."
      }
      onClose={onClose}
    >
      {done ? (
        <div className="publish-success">
          <CheckCircle2 />
          <h3>{ids.length} screen configurations updated</h3>
          <p>
            Browser-local simulation. Remote devices will require your future
            API.
          </p>
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="publish-summary">
            <Radio />
            <div>
              <strong>A new version for every selected screen</strong>
              <p>
                Theme, layout, playlists, products and settings are copied into
                a published snapshot. Offline TVs receive it when connected to
                the future backend.
              </p>
            </div>
          </div>
          <div className="selection-list">
            {db.collections.screens.map((s) => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(s.id)}
                  onChange={() =>
                    setIds((v) =>
                      v.includes(s.id)
                        ? v.filter((id) => id !== s.id)
                        : [...v, s.id],
                    )
                  }
                />
                <span>
                  <b>{s.name}</b>
                  <small>{s.id}</small>
                </span>
                <Badge>{s.status}</Badge>
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <span>{ids.length} screens selected</span>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!ids.length || busy || !can("publish")}
              onClick={async () => {
                setBusy(true);
                const result = await run(
                  () => adminService.publish(ids),
                  "Screen configurations published",
                );
                setBusy(false);
                if (result) setDone(true);
              }}
            >
              {busy ? "Publishing…" : "Publish to screens"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
