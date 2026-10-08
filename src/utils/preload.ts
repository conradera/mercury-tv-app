export function preloadImage(src?: string) {
  if (src) {
    const image = new Image();
    image.src = src;
  }
}
export function preloadVideo(src?: string) {
  if (!src) return () => {};
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.src = src;
  video.load();
  return () => {
    video.removeAttribute("src");
    video.load();
  };
}
