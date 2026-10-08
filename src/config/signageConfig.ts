export const signageConfig = {
  featuredProductDuration: 10000,
  tickerDuration: 8000,
  campaignDuration: 12000,
  transitionDuration: 700,
  bootDuration: 1800,
  mediaLoadTimeout: 12000,
  mediaWatchdogDuration: 180000,
  cursorHideDelay: 3000,
  burnInInterval: 60000,
  showClock: true,
  showContactStrip: true,
  apiBaseUrl: "",
};
export const screenId =
  new URLSearchParams(window.location.search).get("screen") || "default";
