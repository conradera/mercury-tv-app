import type { RealtimeEvent } from "../types/models";
export interface RealtimeAdapter {
  subscribe(listener: (event: RealtimeEvent) => void): () => void;
}
// Replace this same-browser adapter with SSE, WebSocket, or Supabase subscriptions.
export const realtimeService: RealtimeAdapter = {
  subscribe(listener) {
    const notify = () =>
      listener({
        type: "screen.content_changed",
        id: "local",
        time: new Date().toISOString(),
      });
    window.addEventListener("storage", notify);
    window.addEventListener("mercury:database", notify);
    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener("mercury:database", notify);
    };
  },
};
