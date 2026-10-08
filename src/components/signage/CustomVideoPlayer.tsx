import { useEffect, useRef } from "react";
import { signageConfig } from "../../config/signageConfig";
export function CustomVideoPlayer({
  url,
  muted,
  fit = "cover",
  startTime = 0,
  endTime = 0,
  onEnd,
  onError,
  onReady,
}: {
  url: string;
  muted: boolean;
  startTime?: number;
  endTime?: number;
  fit?: "cover" | "contain";
  onEnd: () => void;
  onError: (message: string) => void;
  onReady: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let disposed = false;
    const timer = setTimeout(
      () => onError("Video playback timed out"),
      signageConfig.mediaLoadTimeout,
    );
    const node = ref.current;
    const playing = () => {
      clearTimeout(timer);
      onReady();
    };
    node?.addEventListener("playing", playing);
    node?.play().catch(() => {
      if (!disposed) onError("Video autoplay unavailable");
    });
    return () => {
      disposed = true;
      clearTimeout(timer);
      node?.removeEventListener("playing", playing);
    };
  }, [url, onError, onReady]);
  return (
    <video
      ref={ref}
      className="custom-video"
      style={{ objectFit: fit }}
      src={url}
      autoPlay
      muted={muted}
      playsInline
      preload="auto"
      onLoadedMetadata={(e) => {
        if (startTime > 0)
          e.currentTarget.currentTime = Math.min(
            startTime,
            e.currentTarget.duration || startTime,
          );
      }}
      onTimeUpdate={(e) => {
        if (endTime > 0 && e.currentTarget.currentTime >= endTime) onEnd();
      }}
      onEnded={onEnd}
      onError={() => onError("Video asset unavailable")}
    />
  );
}
