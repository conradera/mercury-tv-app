import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../types/media";
import { signageConfig } from "../config/signageConfig";
export function nextPlayableIndex(
  playlist: MediaItem[],
  current: number,
  failed: Set<string>,
) {
  for (let step = 1; step <= playlist.length; step++) {
    const index = (current + step) % playlist.length;
    if (!failed.has(playlist[index].id)) return index;
  }
  return -1;
}
export function useMediaPlaylist(playlist: MediaItem[], loop = true) {
  const [state, setState] = useState({
    index: 0,
    generation: 0,
    started: Date.now(),
  });
  const failed = useRef(new Set<string>());
  const advanced = useRef(-1);
  const activeGeneration = useRef(state.generation);
  activeGeneration.current = state.generation;
  const item = state.index < 0 ? undefined : playlist[state.index];
  const advance = useCallback(
    (error?: string) => {
      if (
        activeGeneration.current !== state.generation ||
        advanced.current === state.generation
      )
        return;
      advanced.current = state.generation;
      if (error && item) {
        failed.current.add(item.id);
        console.warn(`Mercury: skipping ${item.id}: ${error}`);
      }
      setState((s) =>
        s.generation !== state.generation
          ? s
          : {
              index:
                !loop && s.index === playlist.length - 1
                  ? -1
                  : nextPlayableIndex(playlist, s.index, failed.current),
              generation: s.generation + 1,
              started: Date.now(),
            },
      );
    },
    [state.generation, item, playlist, loop],
  );
  const duration = item?.duration
    ? item.duration * 1000
    : item?.type === "campaign"
      ? signageConfig.campaignDuration
      : signageConfig.mediaWatchdogDuration;
  useEffect(() => {
    if (!item || (item.type === "youtube" && item.playUntilEnd !== false))
      return;
    const timer = setTimeout(() => advance(), duration);
    return () => clearTimeout(timer);
  }, [item, advance, duration]);
  useEffect(() => {
    const reset = () => failed.current.clear();
    window.addEventListener("online", reset);
    return () => window.removeEventListener("online", reset);
  }, []);
  return {
    item,
    index: state.index,
    generation: state.generation,
    advance,
    deadline: state.started + duration,
    duration,
  };
}
