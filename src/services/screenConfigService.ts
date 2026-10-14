import { supabase } from "../utils/supabase/client";
import { useEffect, useState } from "react";
import type { PublishedScreen } from "../types/screenConfig";
import { hydrateAssets } from "../admin/services/assetService";
import { apiEnabled, apiRequest } from "../admin/services/apiClient";
import { readDatabase } from "../admin/services/mockStore";
export function useScreenConfiguration() {
  const [configuration, setConfiguration] = useState<PublishedScreen | null>(
    null,
  );
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preview = params.get("preview");
    const screen = params.get("screen");
    if (!preview && !screen) return;
    let active = true;
    let last = "";
    const load = async () => {
      try {
        const raw = preview
          ? JSON.parse(
              localStorage.getItem(`mercury-preview:${preview}`) || "null",
            )
          : supabase
            ? await supabase
                .from("published_screens")
                .select("data")
                .eq("id", screen!)
                .maybeSingle()
                .then(({ data, error }) => {
                  if (error) throw error;
                  return data?.data;
                })
            : apiEnabled
              ? await apiRequest<PublishedScreen>(
                  `/api/signage/config?screen=${encodeURIComponent(screen!)}`,
                )
              : readDatabase().published[screen!];
        if (!raw) return;
        const serialized = JSON.stringify(raw);
        if (serialized === last) return;
        const hydrated = await hydrateAssets(raw);
        if (active) {
          last = serialized;
          setConfiguration(hydrated);
        }
      } catch (error) {
        console.warn("Mercury: retaining current screen configuration", error);
      }
    };
    void load();
    window.addEventListener("storage", load);
    window.addEventListener("mercury:database", load);
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("storage", load);
      window.removeEventListener("mercury:database", load);
    };
  }, []);
  return configuration;
}
