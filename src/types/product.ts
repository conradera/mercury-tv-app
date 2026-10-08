export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  brand?: string;
  image: string;
  price?: number;
  currency?: string;
  promotionalPrice?: number;
  specifications?: string[];
  availability?: "in_stock" | "out_of_stock" | "limited" | "coming_soon";
  featured?: boolean;
  promotionLabel?: string;
  sidebarVisible?: boolean;
  tickerVisible?: boolean;
  displayPriority?: number;
  displayStart?: string;
  displayEnd?: string;
}
