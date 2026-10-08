import type { PublishedScreen } from "../../types/screenConfig";
export function ConfiguredAppearance({ config }: { config: PublishedScreen }) {
  const t = config.themeData,
    c = t.colors,
    l = config.layoutData;
  const h = l.headerEnabled ? l.headerHeight : 0;
  const ticker = l.tickerEnabled ? l.tickerHeight : 0;
  const footer = l.companyInfoEnabled ? 5 : 0;
  const scale =
    (
      { Small: 0.9, Default: 1, Large: 1.12, "Extra Large": 1.25 } as Record<
        string,
        number
      >
    )[t.typography.scale] || 1;
  const radius =
    (
      { Square: "0", Small: ".25vw", Medium: ".5vw", Large: "1vw" } as Record<
        string,
        string
      >
    )[t.borderRadius] || ".5vw";
  return (
    <style>{`
 :root{--lime:${c.accent};--navy:${c.surface};--muted:${c.mutedText};font-family:"${t.typography.bodyFont}",Arial,sans-serif;color:${c.text}}
 .channel,.section-label,.product-brand{color:${c.primary}}.muted,.specs,.price-caption{color:${c.mutedText}}.availability{color:${c.success}}.pill{background:${c.primary}15;color:${c.primary};border-color:${c.primary}25}
 .signage{background:${c.background};grid-template-rows:${h}% ${100 - h - ticker - footer}% ${ticker}% ${footer}%}
 .header{background:${c.headerBackground};color:${c.text};${!l.headerEnabled ? "visibility:hidden;overflow:hidden;padding:0;" : ""}}
 .brand-logo img{width:${l.logoSize}vw}.clock{${!config.settings.showClock ? "display:none;" : ""}}
 .featured-image{background:#f3f5ef;border-radius:.4vw;padding:.2vw}.ticker-product>img{background:white;border-radius:.25vw;padding:.25vw;mix-blend-mode:normal}
 .featured-panel{background:${c.sidebarBackground};color:${c.text};${!l.sidebarEnabled ? "display:none;" : ""}}
 .content-area{grid-template-columns:${l.sidebarEnabled ? `${l.sidebarWidth}% 1fr` : "1fr"};${l.id === "campaign-fullscreen" ? "padding:0;" : ""}}
 .ticker{background:${c.tickerBackground};color:${c.tickerText};${!l.tickerEnabled ? "visibility:hidden;margin:0;border:0;" : ""}}
 .ticker-label{background:${c.accent}20}.info-strip{${!l.companyInfoEnabled ? "visibility:hidden;padding:0;" : ""}}
 .feature-price{color:${c.price};font-weight:${t.typography.priceWeight};font-size:${1.95 * scale}vw}
 .campaign{background:radial-gradient(ellipse at 80% 40%,${c.secondary},${c.surface} 75%)}
 .campaign-cta{background:${c.cta}}.campaign h1{font-family:"${t.typography.headingFont}",Arial,sans-serif;font-weight:${t.typography.headingWeight};font-size:${4.1 * scale}vw}
 .product-details h2{font-family:"${t.typography.headingFont}",Arial,sans-serif;font-size:${1.65 * scale}vw}
 .featured-panel,.media-panel,.ticker{border-radius:${radius};box-shadow:${t.shadowIntensity === "High" ? "0 .5vw 1.5vw #0004" : t.shadowIntensity === "Medium" ? "0 .3vw 1vw #0002" : t.shadowIntensity === "Low" ? "0 .1vw .4vw #0001" : "none"}}
 ${!config.settings.showPrices ? ".feature-price,.price-caption,.product-details del,.ticker-product strong{display:none}" : ""}
 .custom-video{object-fit:${l.mediaFit}!important}
 ${l.clockPosition === "left" ? ".header-right{flex-direction:row-reverse}.clock{text-align:left}" : ""}
 `}</style>
  );
}
