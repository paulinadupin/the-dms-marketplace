import type { Timestamp } from 'firebase/firestore';
import type { Shop } from './shop';
import type { Item } from './item';

/**
 * DM User Account
 */
export interface DMUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

/**
 * Market - A collection of shops in a story location
 * Each market gets a unique URL for players to access
 */
export interface Market {
  id: string;
  name: string;
  description: string;
  dmId: string; // Owner of this market
  accessCode: string; // URL-friendly code (e.g., "waterdeep-abc123")
  isActive: boolean; // Is this market currently active?
  activeUntil: Timestamp | null; // When the 3-hour activation expires (null if not active)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore representation of Shop (extends base Shop type)
 */
export interface FirestoreShop extends Omit<Shop, 'id' | 'inventory'> {
  id: string;
  marketId: string; // Which market this shop belongs to
  order: number; // Display order in the market
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore representation of Item
 */
export interface FirestoreItem extends Omit<Item, 'id'> {
  shopId: string; // Which shop this item belongs to
  marketId: string; // Which market (for easier querying)
  stock: number | null; // null = unlimited
  priceModifier?: number; // Price adjustment (from ShopItem)
  source: 'official' | 'custom' | 'modified'; // Where it came from
  officialId?: string; // D&D API reference if applicable
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Market creation input (from DM)
 */
export interface CreateMarketInput {
  name: string;
  description: string;
}

/**
 * Shop creation input (from DM)
 */
export interface CreateShopInput {
  marketId: string;
  name: string;
  description: string;
  location: string;
  category: Shop['category'];
  shopkeeper?: string;
  tags?: string[];
}

/**
 * Item creation input (from DM)
 */
export interface CreateItemInput {
  shopId: string;
  marketId: string;
  item: Item;
  stock?: number | null;
  priceModifier?: number;
  source: 'official' | 'custom' | 'modified';
  officialId?: string;
}
