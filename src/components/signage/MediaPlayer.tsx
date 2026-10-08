import { useCallback, useState } from "react";
import type { MediaItem } from "../../types/media";
import type { Campaign } from "../../types/campaign";
import { CampaignSlide } from "./CampaignSlide";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import { YouTubePlayer } from "./YouTubePlayer";
export function MediaPlayer({
  item,
  campaign,
  muted,
  advance,
}: {
  item?: MediaItem;
  campaign: Campaign;
  muted: boolean;
  advance: (error?: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onEnd = useCallback(() => advance(), [advance]);
  const onError = useCallback((error: string) => advance(error), [advance]);
  return (
    <div className="media-item">
      <CampaignSlide campaign={campaign} />
      {item?.type !== "campaign" && item?.url && (
        <div className={`video-layer ${ready ? "ready" : ""}`}>
          {item.type === "youtube" ? (
            <YouTubePlayer
              url={item.url}
              startTime={item.startTime}
              endTime={item.endTime}
              muted={muted}
              onReady={onReady}
              onEnd={onEnd}
              onError={onError}
            />
          ) : (
            <CustomVideoPlayer
              url={item.url}
              startTime={item.startTime}
              endTime={item.endTime}
              muted={muted}
              fit={item.fit}
              onReady={onReady}
              onEnd={onEnd}
              onError={onError}
            />
          )}
        </div>
      )}
    </div>
  );
}
