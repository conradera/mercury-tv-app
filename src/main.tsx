import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-700.css";
const PairingScreen = lazy(() => import("./components/signage/PairingScreen"));
const pairing = new URLSearchParams(location.search).get("pair") === "true";
const AdminApp = lazy(() => import("./admin/AdminApp"));
const admin = window.location.pathname.startsWith("/admin");
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {admin ? (
      <Suspense
        fallback={
          <div
            style={{
              height: "100vh",
              display: "grid",
              placeItems: "center",
              background: "#f6f7f9",
              color: "#172334",
            }}
          >
            Loading Mercury Control Center…
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    ) : pairing ? (
      <Suspense fallback={<div />}>
        <PairingScreen />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
