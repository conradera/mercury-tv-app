import { useEffect, useState } from "react";
import { Monitor, RefreshCw } from "lucide-react";
import { MercuryLogo } from "./MercuryHeader";
import { readDatabase } from "../../admin/services/mockStore";
const key = "mercury-pairing-demo";
function createPairing() {
  const value = {
    pin: String(Math.floor(100000 + Math.random() * 900000)),
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}
export default function PairingScreen() {
  const [pairing, setPairing] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved?.expiresAt > Date.now())
        return saved as { pin: string; expiresAt: number };
    } catch {
      /* Start a fresh demo pairing. */
    }
    return createPairing();
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const check = () => {
      if (Date.now() > pairing.expiresAt) return;
      const screen = readDatabase().collections.screens.find(
        (s) => s.pairingPin === pairing.pin,
      );
      if (screen)
        location.replace(
          `/?screen=${encodeURIComponent(screen.id)}&mode=display`,
        );
    };
    const timer = setInterval(() => {
      setNow(Date.now());
      check();
    }, 1000);
    window.addEventListener("storage", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", check);
    };
  }, [pairing]);
  const expired = now >= pairing.expiresAt;
  return (
    <main className="pairing-screen">
      <MercuryLogo />
      <Monitor />
      <span>CONNECT YOUR MERCURY DISPLAY</span>
      <h1>{expired ? "Pairing code expired" : "Pair this screen"}</h1>
      <p>
        In your control center, open Screens → Register screen
        <br />
        and enter the pairing code below.
      </p>
      <div className="pairing-code">
        {expired ? "— — — — — —" : pairing.pin}
      </div>
      <small>
        {expired
          ? "Generate a new code to continue."
          : `Valid for ${Math.max(1, Math.ceil((pairing.expiresAt - now) / 60000))} minutes`}
      </small>
      <button onClick={() => setPairing(createPairing())}>
        <RefreshCw size={17} />
        Generate a new code
      </button>
      <footer>
        Local pairing demonstration · Admin and TV must use the same browser and
        origin.
        <br />
        Production device pairing requires the future API.
      </footer>
    </main>
  );
}
