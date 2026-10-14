import { youtubeId } from "../../utils/youtube";
export { youtubeId } from "../../utils/youtube";
import { useEffect, useRef } from "react";
import { signageConfig } from "../../config/signageConfig";
interface Player {
  mute(): void;
  unMute(): void;
  playVideo(): void;
  destroy(): void;
  getCurrentTime(): number;
}
interface YouTubeAPI {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (event: { target: Player }) => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => Player;
}
declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let apiPromise: Promise<YouTubeAPI> | undefined;
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise)
    apiPromise = new Promise<YouTubeAPI>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      const timeout = setTimeout(() => {
        script.remove();
        apiPromise = undefined;
        reject(new Error("YouTube API timeout"));
      }, signageConfig.mediaLoadTimeout);
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        if (window.YT) resolve(window.YT);
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        apiPromise = undefined;
        reject(new Error("YouTube API unavailable"));
      };
      document.head.appendChild(script);
    });
  return apiPromise;
}
export function YouTubePlayer({
  url,
  muted,
  onEnd,
  onError,
  onReady,
  startTime = 0,
  endTime = 0,
}: {
  url: string;
  muted: boolean;
  startTime?: number;
  endTime?: number;
  onEnd: () => void;
  onError: (message: string) => void;
  onReady: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  useEffect(() => {
    let disposed = false;
    let ready = false;
    let lastPosition = -1;
    let lastProgress = Date.now();
    const stallTimer = setInterval(() => {
      if (disposed || !ready) return;
      const position = playerRef.current?.getCurrentTime();
      if (position !== undefined && position !== lastPosition) {
        lastPosition = position;
        lastProgress = Date.now();
      } else if (Date.now() - lastProgress > 45000)
        onError("YouTube playback stalled");
    }, 5000);
    const timer = setTimeout(() => {
      if (!ready) onError("YouTube playback timed out");
    }, signageConfig.mediaLoadTimeout);
    const id = youtubeId(url);
    if (!id) {
      onError("Invalid YouTube URL");
      return () => {
        clearTimeout(timer);
        clearInterval(stallTimer);
      };
    }
    loadAPI()
      .then((api) => {
        if (disposed || !container.current) return;
        const node = document.createElement("div");
        container.current.appendChild(node);
        playerRef.current = new api.Player(node, {
          videoId: id,
          playerVars: {
            autoplay: 1,
            mute: 1,
            start: startTime,
            ...(endTime > 0 ? { end: endTime } : {}),
            controls: 0,
            rel: 0,
            playsinline: 1,
            disablekb: 1,
            origin: location.origin,
          },
          events: {
            onReady: (e) => {
              if (disposed) return;
              if (mutedRef.current) e.target.mute();
              else e.target.unMute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (disposed) return;
              if (e.data === 1) {
                ready = true;
                clearTimeout(timer);
                onReady();
              }
              if (e.data === 0) onEnd();
            },
            onError: (event) => {
              if (!disposed)
                onError(`YouTube could not play this item (${event.data})`);
            },
          },
        });
      })
      .catch((error) => {
        if (!disposed) onError(String(error));
      });
    return () => {
      disposed = true;
      clearInterval(stallTimer);
      clearTimeout(timer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [url, onEnd, onError, onReady, startTime, endTime]);
  useEffect(() => {
    if (muted) playerRef.current?.mute();
    else playerRef.current?.unMute();
  }, [muted]);
  return <div ref={container} className="youtube-player" />;
}
