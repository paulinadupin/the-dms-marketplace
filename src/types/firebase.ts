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
 * Item Library - DM's personal catalog of reusable item templates
 * Items here can be added to multiple shops with shop-specific pricing/stock
 */
export interface ItemLibrary {
  id: string;
  dmId: string; // Owner of this item template
  item: Item; // Full item data (all stats, properties, etc.)
  source: 'official' | 'custom' | 'modified'; // Where it came from
  officialId?: string; // D&D API reference if imported from API
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Shop Item - Reference to a library item with shop-specific data
 * Links an item from the library to a specific shop with custom price/stock
 */
export interface ShopItem {
  id: string;
  shopId: string; // Which shop this item is in
  marketId: string; // Which market (for easier querying)
  itemLibraryId: string; // Reference to ItemLibrary
  price: Item['cost']; // Shop-specific price (can differ from library template)
  stock: number | null; // Shop-specific stock (null = unlimited)
  isIndependent: boolean; // If true, this item is "kept separate" from library updates
  customData?: Item; // Snapshot of item data if isIndependent=true (for items that diverged)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * @deprecated Use ItemLibrary and ShopItem instead
 * Firestore representation of Item (OLD STRUCTURE - kept for migration)
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
 * Item Library creation input (add to personal catalog)
 */
export interface CreateItemLibraryInput {
  item: Item; // Full item data
  source: 'official' | 'custom' | 'modified';
  officialId?: string; // D&D API ID if imported
}

/**
 * Add item from library to a shop
 */
export interface AddItemToShopInput {
  shopId: string;
  marketId: string;
  itemLibraryId: string; // Which library item to add
  price?: Item['cost']; // Custom price (defaults to library item's cost)
  stock?: number | null; // Starting stock (null = unlimited)
}

/**
 * @deprecated Use CreateItemLibraryInput and AddItemToShopInput instead
 * Item creation input (OLD STRUCTURE - kept for migration)
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
