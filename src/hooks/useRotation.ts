import { useEffect, useState } from "react";
export function useRotation(
  length: number,
  duration: number,
  durations?: number[],
) {
  const [index, setIndex] = useState(0);
  const currentDuration = durations?.[length ? index % length : 0] || duration;
  useEffect(() => {
    if (length < 2) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % length),
      currentDuration,
    );
    return () => clearInterval(timer);
  }, [length, currentDuration]);
  return { index: length ? index % length : 0, select: setIndex };
}
