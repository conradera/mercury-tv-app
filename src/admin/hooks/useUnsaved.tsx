import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { Modal } from "../components/UI";
export function UnsavedGuard({
  dirty,
  onSave,
}: {
  dirty: boolean;
  onSave: () => Promise<boolean>;
}) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return blocker.state === "blocked" ? (
    <Modal
      title="You have unsaved changes"
      description="Save a draft before leaving, or discard your changes."
      onClose={() => blocker.reset()}
    >
      <div className="modal-footer">
        <button className="btn" onClick={() => blocker.reset()}>
          Stay
        </button>
        <button className="btn" onClick={() => blocker.proceed()}>
          Discard
        </button>
        <button
          className="btn primary"
          onClick={async () => {
            if (await onSave()) blocker.proceed();
          }}
        >
          Save Draft
        </button>
      </div>
    </Modal>
  ) : null;
}
