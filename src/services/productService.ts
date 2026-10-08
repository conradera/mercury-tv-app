import { mockProducts } from "../data/mockProducts";
import { getContent } from "./contentService";
export const getProducts = () =>
  getContent("products", "products", mockProducts);
export const getFeaturedProducts = async () =>
  (await getProducts()).filter((p) => p.featured);
