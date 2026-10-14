import {
  getWebsiteCatalog,
  websiteProductsEnabled,
} from "./services/websiteProductService";
import type { Product } from "./types/product";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { company } from "./config/company";
import { signageConfig, screenId } from "./config/signageConfig";
import { mockProducts } from "./data/mockProducts";
import { mockCampaigns, mockAnnouncements } from "./data/mockCampaigns";
import { mockMedia } from "./data/mockMedia";
import { getProducts } from "./services/productService";
import { getMediaPlaylist } from "./services/mediaService";
import { getCampaigns, getAnnouncements } from "./services/campaignService";
import { useRotation } from "./hooks/useRotation";
import { preloadImage } from "./utils/preload";
import { MercuryHeader, MercuryLogo } from "./components/signage/MercuryHeader";
import { FeaturedProductPanel } from "./components/signage/FeaturedProductPanel";
import { ProductTicker } from "./components/signage/ProductTicker";
import { MediaPlaylistManager } from "./components/signage/MediaPlaylistManager";
import { CompanyInfoStrip } from "./components/signage/CompanyInfoStrip";
import { SignageLayout } from "./components/signage/SignageLayout";
import { useScreenConfiguration } from "./services/screenConfigService";
import { ConfiguredAppearance } from "./components/signage/ConfiguredAppearance";
import { ErrorBoundary } from "./components/signage/ErrorBoundary";
import { convertUsdToUgx, DEFAULT_USD_TO_UGX_RATE } from "./utils/currency";

const configuredUsdToUgxRate = Number(import.meta.env.VITE_USD_TO_UGX_RATE);
const usdToUgxRate =
  Number.isFinite(configuredUsdToUgxRate) && configuredUsdToUgxRate > 0
    ? configuredUsdToUgxRate
    : DEFAULT_USD_TO_UGX_RATE;

function toDisplayCurrency(product: Product): Product {
  if (product.currency?.toUpperCase() !== "USD") return product;
  return {
    ...product,
    price: convertUsdToUgx(product.price, usdToUgxRate),
    promotionalPrice: convertUsdToUgx(product.promotionalPrice, usdToUgxRate),
    currency: "UGX",
  };
}

function Display() {
  const screenConfig = useScreenConfiguration();
  const [websiteProducts, setWebsiteProducts] = useState<Product[] | null>(
    null,
  );
  const [catalogStatus, setCatalogStatus] = useState("");
  useEffect(() => {
    if (!websiteProductsEnabled) return;
    let active = true;
    const refresh = async () => {
      try {
        const catalog = await getWebsiteCatalog();
        if (active) {
          setWebsiteProducts(catalog.products);
          setCatalogStatus(
            catalog.stale
              ? "Showing last available website prices"
              : "Live website products · UGX",
          );
        }
      } catch {
        if (active)
          setCatalogStatus("Website products unavailable · reconnecting");
      }
    };
    void refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("online", refresh);
    };
  }, []);
  useEffect(() => {
    if (!screenConfig) return;
    Object.assign(company, screenConfig.company);
    signageConfig.showClock = screenConfig.settings.showClock;
    signageConfig.campaignDuration =
      screenConfig.settings.campaignRotation || 12000;
    signageConfig.transitionDuration =
      screenConfig.themeData.animationSpeed === "Slow"
        ? 1000
        : screenConfig.themeData.animationSpeed === "Fast"
          ? 350
          : 700;
    if (screenConfig.company.favicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel=icon]");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = screenConfig.company.favicon;
    }
    setContent({
      products: screenConfig.products,
      playlist: screenConfig.media,
      campaigns: screenConfig.campaigns,
      announcements: screenConfig.announcements,
    });
  }, [screenConfig]);
  const [content, setContent] = useState({
    products: websiteProductsEnabled ? ([] as Product[]) : mockProducts,
    playlist: mockMedia,
    campaigns: mockCampaigns,
    announcements: mockAnnouncements,
  });
  const [booting, setBooting] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [size, setSize] = useState(`${innerWidth} × ${innerHeight}`);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState({
    index: 0,
    title: "Starting",
    deadline: Date.now(),
  });
  const onStatus = useCallback((s: typeof status) => setStatus(s), []);
  const query = new URLSearchParams(location.search);
  const display = query.get("mode") === "display";
  const debug = query.get("debug") === "true";
  const products = (
    websiteProductsEnabled
      ? screenConfig
        ? content.products.flatMap((product) => {
            if (!product.id.startsWith("website:")) return [product];
            if (!websiteProducts) return [product];
            const current = websiteProducts.find((p) => p.id === product.id);
            if (!current) return [];
            return [
              {
                ...product,
                name: current.name,
                image: current.image,
                category: current.category,
                brand: current.brand,
                price: (product as Product & { hidePrice?: boolean }).hidePrice
                  ? undefined
                  : current.price,
                promotionalPrice: (product as Product & { hidePrice?: boolean })
                  .hidePrice
                  ? undefined
                  : current.promotionalPrice,
                currency: current.currency,
                specifications: current.specifications,
                availability: current.availability,
              },
            ];
          })
        : websiteProducts || []
      : content.products
  ).map(toDisplayCurrency);
  const featured = products
    .filter((p) => p.featured)
    .flatMap((p) =>
      Array.from(
        {
          length: Math.min(
            3,
            Math.max(1, Math.round((p.displayPriority || 1) / 4)),
          ),
        },
        () => p,
      ),
    );
  const assigned = screenConfig
    ? products.filter((p) => screenConfig.featuredProducts.includes(p.id))
    : [];
  const featuredProducts = screenConfig
    ? assigned
    : featured.length
      ? featured
      : products;
  const rotation = useRotation(
    featuredProducts.length,
    screenConfig?.settings.featuredRotation ||
      signageConfig.featuredProductDuration,
  );
  const announcement = useRotation(
    content.announcements.length,
    signageConfig.tickerDuration,
    content.announcements.map((item) => (item.duration || 0) * 1000),
  );
  const selectedAnnouncement = content.announcements[announcement.index];
  const activeAnnouncement =
    selectedAnnouncement &&
    (!selectedAnnouncement.expiresAt ||
      new Date(selectedAnnouncement.expiresAt).getTime() > now)
      ? selectedAnnouncement
      : undefined;
  useEffect(() => {
    let active = true;
    Promise.all([
      websiteProductsEnabled ? Promise.resolve([] as Product[]) : getProducts(),
      getMediaPlaylist(),
      getCampaigns(),
      getAnnouncements(),
    ]).then(([products, playlist, campaigns, announcements]) => {
      const params = new URLSearchParams(location.search);
      if (active && !params.get("screen") && !params.get("preview"))
        setContent({ products, playlist, campaigns, announcements });
    });
    const timer = setTimeout(
      () => setBooting(false),
      signageConfig.bootDuration,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  useEffect(
    () =>
      preloadImage(
        featuredProducts[(rotation.index + 1) % featuredProducts.length]?.image,
      ),
    [rotation.index, featuredProducts],
  );
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const resize = () => setSize(`${innerWidth} × ${innerHeight}`);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("resize", resize);
    const tick =
      debug ||
      !!screenConfig?.emergency ||
      content.announcements.some((item) => !!item.expiresAt)
        ? setInterval(() => setNow(Date.now()), 1000)
        : undefined;
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("resize", resize);
      clearInterval(tick);
    };
  }, [debug, screenConfig?.emergency, content.announcements]);
  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % 4;
      document.documentElement.style.setProperty(
        "--logo-shift",
        `${step - 1}px`,
      );
    }, signageConfig.burnInInterval);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!display) return;
    let timer: ReturnType<typeof setTimeout>;
    const move = () => {
      document.body.classList.remove("cursor-hidden");
      clearTimeout(timer);
      timer = setTimeout(
        () => document.body.classList.add("cursor-hidden"),
        signageConfig.cursorHideDelay,
      );
    };
    move();
    window.addEventListener("mousemove", move);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", move);
      document.body.classList.remove("cursor-hidden");
    };
  }, [display]);
  const tickerProducts = screenConfig
    ? products.filter((p) => screenConfig.tickerProducts.includes(p.id))
    : [...products.slice(7), ...products.slice(0, 7)];
  return (
    <>
      {screenConfig && <ConfiguredAppearance config={screenConfig} />}
      <SignageLayout
        blueWhite={
          !screenConfig ||
          (["mercury-dark", "mercury-classic"].includes(
            screenConfig.themeData.id,
          ) &&
            ["#3159ba", "#2596be"].includes(
              screenConfig.themeData.colors.primary.toLowerCase(),
            ))
        }
        header={<MercuryHeader />}
        featured={
          <FeaturedProductPanel
            products={featuredProducts}
            index={rotation.index}
            select={rotation.select}
          />
        }
        media={
          screenConfig?.settings.paused ? (
            <div />
          ) : (
            <MediaPlaylistManager
              key={screenConfig?.version || 0}
              forceMuted={screenConfig?.settings.muted}
              loop={screenConfig?.settings.loopPlaylist}
              preload={screenConfig?.settings.preload}
              animationStyle={screenConfig?.themeData.animationStyle}
              playlist={content.playlist}
              campaigns={content.campaigns}
              products={products}
              display={display}
              onStatus={onStatus}
            />
          )
        }
        ticker={
          <ProductTicker
            products={tickerProducts}
            duration={screenConfig?.settings.tickerRotation}
          />
        }
        footer={
          signageConfig.showContactStrip ? (
            <CompanyInfoStrip
              announcement={
                !activeAnnouncement?.type ||
                activeAnnouncement.type === "ticker"
                  ? activeAnnouncement?.text
                  : undefined
              }
            />
          ) : (
            <div />
          )
        }
      />
      {activeAnnouncement &&
        ["banner", "fullscreen"].includes(activeAnnouncement.type || "") && (
          <div
            className={`tv-announcement-${activeAnnouncement.type}`}
            style={{
              background: activeAnnouncement.background,
              color: activeAnnouncement.color,
            }}
          >
            <h1>{activeAnnouncement.text}</h1>
          </div>
        )}
      {screenConfig?.settings.paused && (
        <div className="tv-override">
          <MercuryLogo />
          <h1>Display paused</h1>
          <p>Technology. Business. Connected.</p>
        </div>
      )}
      {screenConfig?.emergency &&
        new Date(screenConfig.emergency.expiresAt).getTime() > Date.now() && (
          <div
            className="tv-override"
            style={{
              background: screenConfig.emergency.background,
              color: screenConfig.emergency.color,
            }}
          >
            <h1>{screenConfig.emergency.message}</h1>
          </div>
        )}
      {websiteProductsEnabled &&
        (catalogStatus.includes("unavailable") ||
          catalogStatus.includes("last available")) && (
          <div role="status" className="catalog-status">
            {catalogStatus}
          </div>
        )}
      <AnimatePresence>
        {booting && (
          <motion.div
            className="boot-screen"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <MercuryLogo loading />
            <p>{company.tagline}</p>
            <div className="boot-loader" />
            <small>LOADING DIGITAL DISPLAY</small>
          </motion.div>
        )}
      </AnimatePresence>
      {debug && (
        <aside className="debug-panel">
          <b>DISPLAY DIAGNOSTICS</b>
          <span>
            Screen: {screenId} · {size}
          </span>
          <span>
            Media: {status.index} · {status.title}
          </span>
          <span>Product: {rotation.index}</span>
          <span>
            Next media transition:{" "}
            {Math.max(0, Math.ceil((status.deadline - now) / 1000))}s
          </span>
          <span>
            Network: {online ? "Online" : "Offline · local content available"}
          </span>
          <span>
            {websiteProductsEnabled
              ? catalogStatus
              : "Demo prices and availability"}
          </span>
        </aside>
      )}
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <Display />
    </ErrorBoundary>
  );
}
