import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Cpu } from "lucide-react";
import type { Product } from "../../types/product";
import { ProductImage } from "./ProductImage";
import { formatCurrency } from "../../utils/currency";
import { signageConfig } from "../../config/signageConfig";
export function FeaturedProductPanel({
  products,
  index,
  select,
}: {
  products: Product[];
  index: number;
  select: (i: number) => void;
}) {
  const p = products[index];
  if (!p) return null;
  return (
    <aside className="featured-panel">
      <div className="section-label">
        <span>IN THE SPOTLIGHT</span>
        <ArrowUpRight size={18} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          className="featured-content"
          key={p.id + index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: signageConfig.transitionDuration / 2000 }}
        >
          <div className="feature-top">
            <span className="pill">{p.promotionLabel}</span>
            <span className="product-brand">{p.brand}</span>
          </div>
          <div className="featured-image">
            <ProductImage src={p.image} alt={p.name} />
          </div>
          <div className="product-details">
            <span className="eyebrow muted">{p.category}</span>
            <h2>{p.name}</h2>
            <div className="specs">
              <Cpu />
              {p.specifications?.slice(0, 3).join(" / ")}
            </div>
            <div className="price-caption">YOUR NEXT UPGRADE</div>
            {p.promotionalPrice && (
              <del>{formatCurrency(p.price, p.currency)}</del>
            )}
            <div className="feature-price">
              {formatCurrency(p.promotionalPrice ?? p.price, p.currency)}
            </div>
            <div className="availability">
              <Check size={15} />
              {p.availability === "out_of_stock"
                ? "ASK ABOUT AVAILABILITY"
                : p.availability === "limited"
                  ? "LIMITED STOCK"
                  : p.availability === "coming_soon"
                    ? "COMING SOON"
                    : "AVAILABLE IN STORE"}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="feature-bottom">
        <span>
          Find your perfect fit. <b>Ask our team.</b>
        </span>
        <div className="dots">
          {products.map((p, i) => (
            <button
              key={p.id + i}
              aria-label={`Show ${p.name}`}
              className={i === index ? "active" : ""}
              onClick={() => select(i)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
