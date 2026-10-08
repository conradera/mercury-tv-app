import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Maximize,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaItem } from "../../types/media";
import type { Campaign } from "../../types/campaign";
import type { Product } from "../../types/product";
import { useMediaPlaylist } from "../../hooks/useMediaPlaylist";
import { useRotation } from "../../hooks/useRotation";
import { signageConfig } from "../../config/signageConfig";
import { preloadImage, preloadVideo } from "../../utils/preload";
import { MediaPlayer } from "./MediaPlayer";
export function MediaPlaylistManager({
  playlist,
  campaigns,
  products,
  display,
  onStatus,
  forceMuted,
  loop = true,
  preload = true,
  animationStyle = "Crossfade",
}: {
  playlist: MediaItem[];
  campaigns: Campaign[];
  products: Product[];
  display: boolean;
  forceMuted?: boolean;
  loop?: boolean;
  preload?: boolean;
  animationStyle?: string;
  onStatus: (status: {
    index: number;
    title: string;
    deadline: number;
  }) => void;
}) {
  const { item, index, generation, advance, deadline, duration } =
    useMediaPlaylist(playlist, loop);
  const [muted, setMuted] = useState(forceMuted ?? true);
  useEffect(() => {
    setMuted(forceMuted ?? item?.muted ?? true);
  }, [forceMuted, item?.id, item?.muted]);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const fallback = useRotation(products.length, signageConfig.campaignDuration);
  const product = products[fallback.index];
  const campaign = campaigns.find((c) => c.id === item?.campaignId) ||
    (item ? campaigns[0] : undefined) || {
      id: "fallback",
      eyebrow: product?.category || "WELCOME TO MERCURY",
      title: product?.name || "Technology. Business.",
      accent: "Connected.",
      description:
        product?.specifications?.join(" • ") || "Discover more in store.",
      image: product?.image || "",
      tags: ["Genuine products", "Expert advice"],
    };
  useEffect(
    () =>
      onStatus({
        index,
        title: item?.title || "Local product rotation",
        deadline,
      }),
    [index, item, deadline, onStatus],
  );
  useEffect(() => {
    if (!preload) return;
    const next = playlist[(index + 1) % playlist.length];
    preloadImage(campaigns.find((c) => c.id === next?.campaignId)?.image);
    if (next?.type === "video") return preloadVideo(next.url);
  }, [index, playlist, campaigns, preload]);
  useEffect(() => {
    const change = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setNotice("Use your browser’s fullscreen command.");
      setTimeout(() => setNotice(""), 5000);
    }
  };
  return (
    <section className="media-panel">
      <div className="media-topline">
        <span>
          <i /> THE MERCURY EDIT
        </span>
        <span>
          TECHNOLOGY THAT MOVES YOU FORWARD <ArrowUpRight size={14} />
        </span>
      </div>
      <div className="media-stage">
        <AnimatePresence>
          <motion.div
            className="media-frame"
            key={generation + "-" + (!item ? fallback.index : "")}
            initial={{
              opacity: 0,
              x: animationStyle === "Slide" ? 16 : 0,
              scale: animationStyle === "Smooth Zoom" ? 1.03 : 1,
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: signageConfig.transitionDuration / 1000 }}
          >
            <MediaPlayer
              item={item}
              campaign={campaign}
              muted={muted}
              advance={advance}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="media-bottomline">
        <div className="now-playing">
          <span className="live-dot" />
          <span>NOW SHOWING</span>
          <strong>{item?.title || product?.name || "Mercury Computers"}</strong>
        </div>
        <div className="media-actions">
          <span className="slide-count">
            {String(Math.max(0, index) + 1).padStart(2, "0")}{" "}
            <span>/ {String(playlist.length || 1).padStart(2, "0")}</span>
          </span>
          {!display && !fullscreen && (
            <>
              <button
                aria-label={muted ? "Unmute media" : "Mute media"}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <VolumeX /> : <Volume2 />}
              </button>
              <button aria-label="Next media" onClick={() => advance()}>
                <SkipForward />
              </button>
              <button aria-label="Enter fullscreen" onClick={enterFullscreen}>
                <Maximize />
              </button>
            </>
          )}
        </div>
      </div>
      {!(item?.type === "youtube" && item.playUntilEnd !== false) && (
        <motion.div
          className="media-progress"
          key={generation}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
      {notice && (
        <div role="status" className="notice">
          {notice}
        </div>
      )}
    </section>
  );
}
