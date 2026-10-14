import { mockProducts } from "../data/mockProducts";
import { getContent } from "./contentService";
import {
  getWebsiteCatalog,
  websiteProductsEnabled,
} from "./websiteProductService";
export const getProducts = async () =>
  websiteProductsEnabled
    ? (await getWebsiteCatalog()).products
    : getContent("products", "products", mockProducts);
export const getFeaturedProducts = async () =>
  (await getProducts()).filter((p) => p.featured);
