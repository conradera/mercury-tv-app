import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { Campaign } from "../../types/campaign";
import { ProductImage } from "./ProductImage";
export function CampaignSlide({ campaign }: { campaign: Campaign }) {
  return (
    <div
      className="campaign"
      style={{
        background: campaign.background || undefined,
        color: campaign.color || undefined,
      }}
    >
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="campaign-grid" />
      <div className="campaign-copy">
        <span className="campaign-eyebrow">
          <i />
          {campaign.eyebrow}
        </span>
        <h1>
          {campaign.title.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
          <em>{campaign.accent}</em>
        </h1>
        <p>{campaign.description}</p>
        <div className="campaign-cta">
          {campaign.cta || "Discover more in store"} <ArrowUpRight />
        </div>
      </div>
      <motion.div
        className="hero-product"
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1.025, y: -4 }}
        transition={{ duration: 12, ease: "linear" }}
      >
        <ProductImage src={campaign.image} alt="Featured Mercury technology" />
      </motion.div>
      <div className="hero-stamp">
        <ShieldCheck />
        <span>
          GENUINE TECHNOLOGY.
          <br />
          <b>REAL POSSIBILITIES.</b>
        </span>
      </div>
      <div className="campaign-tags">
        {campaign.tags.map((t) => (
          <span key={t}>
            <i />
            {t}
          </span>
        ))}
      </div>
      <span className="campaign-watermark">mercury</span>
    </div>
  );
}
