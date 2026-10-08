import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Product } from "../../types/product";
import { useRotation } from "../../hooks/useRotation";
import { signageConfig } from "../../config/signageConfig";
import { preloadImage } from "../../utils/preload";
import { ProductImage } from "./ProductImage";
import { formatCurrency } from "../../utils/currency";
export function ProductTicker({
  products,
  duration = signageConfig.tickerDuration,
}: {
  products: Product[];
  duration?: number;
}) {
  const groups = Math.ceil(products.length / 4);
  const { index } = useRotation(groups, duration);
  useEffect(() => {
    for (let i = 0; i < 4; i++)
      preloadImage(products[((index + 1) * 4 + i) % products.length]?.image);
  }, [index, products]);
  return (
    <section className="ticker">
      <div className="ticker-label">
        <span>MORE TO</span>
        <strong>
          discover<span>.</span>
        </strong>
        <ArrowRight />
      </div>
      <div className="ticker-window">
        <AnimatePresence mode="wait">
          <motion.div
            className="ticker-products"
            key={index}
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.35 }}
          >
            {products.slice(index * 4, index * 4 + 4).map((p) => (
              <article className="ticker-product" key={p.id}>
                <ProductImage src={p.image} alt={p.name} />
                <div>
                  <span className="eyebrow muted">{p.category}</span>
                  <h3>{p.name}</h3>
                  <strong>
                    {formatCurrency(p.promotionalPrice ?? p.price, p.currency)}
                  </strong>
                </div>
              </article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
