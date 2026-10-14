import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const demoEnabled = import.meta.env.VITE_DEMO_MODE === "true";
export const supabaseEnabled = !demoEnabled && !!url && !!key;
// Respect Remember me without keeping non-persistent sessions across browser restarts.
const storage = {
  getItem: (key: string) =>
    sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    const remember = localStorage.getItem("mercury-remember") === "true";
    (remember ? sessionStorage : localStorage).removeItem(key);
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },
};
export const supabase = supabaseEnabled
  ? createClient(url!, key!, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
