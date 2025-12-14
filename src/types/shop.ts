import type { Item } from "./item";
import type { Currency } from "./currency";

export type ShopCategory =
  | "general"
  | "blacksmith"
  | "armorer"
  | "fletcher"
  | "leatherworker"
  | "magic"
  | "alchemist"
  | "trinket"
  | "tavern"
  | "temple"
  | "market"
  | "toolshop"
  | "library"
  | "guildhall"
  | "inn"
  | "stable"
  | "other";

export interface ShopItem {
  item: Item;
  stock: number;
  priceModifier?: number;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  location: string;
  category: ShopCategory;
  shopkeeper?: string;
  inventory: ShopItem[];
  currency: Currency;
  tags: string[];
}
