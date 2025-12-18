import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ShopItem, AddItemToShopInput, ItemLibrary } from '../types/firebase';
import { ItemLibraryService } from './item-library.service';
import { LIMITS } from '../config/limits';

export class ShopItemService {
  private static readonly COLLECTION = 'shopItems';

  /**
   * Add an item from the library to a shop
   */
  static async addItemToShop(input: AddItemToShopInput): Promise<ShopItem> {
    try {
      // Check shop item limit
      const currentItems = await this.getItemsByShop(input.shopId);
      if (currentItems.length >= LIMITS.ITEMS_PER_SHOP) {
        throw new Error(`This shop has reached the maximum limit of ${LIMITS.ITEMS_PER_SHOP} items. Please remove some items before adding new ones.`);
      }

      // Get the library item to use default price if not provided
      const libraryItem = await ItemLibraryService.getItem(input.itemLibraryId);

      if (!libraryItem) {
        throw new Error('Library item not found');
      }

      const shopItemData = {
        shopId: input.shopId,
        marketId: input.marketId,
        itemLibraryId: input.itemLibraryId,
        price: input.price || libraryItem.item.cost,
        stock: input.stock !== undefined ? input.stock : null,
        isIndependent: false,
        customData: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), shopItemData);

      return {
        id: docRef.id,
        ...shopItemData,
      };
    } catch (error: any) {
      throw new Error('Failed to add item to shop: ' + error.message);
    }
  }

  /**
   * Get a single shop item by ID
   */
  static async getShopItem(shopItemId: string): Promise<ShopItem | null> {
    try {
      const docRef = doc(db, this.COLLECTION, shopItemId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ShopItem;
    } catch (error: any) {
      throw new Error('Failed to get shop item: ' + error.message);
    }
  }

  /**
   * Get all items in a shop
   */
  static async getItemsByShop(shopId: string): Promise<ShopItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('shopId', '==', shopId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ShopItem[];
    } catch (error: any) {
      throw new Error('Failed to get shop items: ' + error.message);
    }
  }

  /**
   * Get all items in a market (across all shops)
   */
  static async getItemsByMarket(marketId: string): Promise<ShopItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ShopItem[];
    } catch (error: any) {
      throw new Error('Failed to get market items: ' + error.message);
    }
  }

  /**
   * Update shop item (price, stock, or make independent)
   */
  static async updateShopItem(
    shopItemId: string,
    updates: {
      price?: ShopItem['price'];
      stock?: number | null;
      isIndependent?: boolean;
      customData?: ShopItem['customData'];
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, shopItemId);

      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      if (updates.price !== undefined) {
        updateData.price = updates.price;
      }
      if (updates.stock !== undefined) {
        updateData.stock = updates.stock;
      }
      if (updates.isIndependent !== undefined) {
        updateData.isIndependent = updates.isIndependent;
      }
      if (updates.customData !== undefined) {
        updateData.customData = updates.customData;
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      throw new Error('Failed to update shop item: ' + error.message);
    }
  }

  /**
   * Make a shop item independent (keep separate from library updates)
   * Takes a snapshot of the current library item data
   */
  static async makeItemIndependent(shopItemId: string): Promise<void> {
    try {
      const shopItem = await this.getShopItem(shopItemId);

      if (!shopItem) {
        throw new Error('Shop item not found');
      }

      if (shopItem.isIndependent) {
        throw new Error('Item is already independent');
      }

      // Get the current library item data to snapshot
      const libraryItem = await ItemLibraryService.getItem(shopItem.itemLibraryId);

      if (!libraryItem) {
        throw new Error('Library item not found');
      }

      await this.updateShopItem(shopItemId, {
        isIndependent: true,
        customData: libraryItem.item,
      });
    } catch (error: any) {
      throw new Error('Failed to make item independent: ' + error.message);
    }
  }

  /**
   * Remove an item from a shop
   * Does NOT delete from library
   */
  static async removeItemFromShop(shopItemId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, shopItemId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error('Failed to remove item from shop: ' + error.message);
    }
  }

  /**
   * Delete all items from a shop (when deleting the shop)
   */
  static async deleteAllItemsInShop(shopId: string): Promise<void> {
    try {
      const items = await this.getItemsByShop(shopId);

      if (items.length === 0) {
        return;
      }

      const batch = writeBatch(db);

      items.forEach((item) => {
        const docRef = doc(db, this.COLLECTION, item.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error('Failed to delete shop items: ' + error.message);
    }
  }

  /**
   * Delete all items in a market (when deleting the market)
   */
  static async deleteAllItemsInMarket(marketId: string): Promise<void> {
    try {
      const items = await this.getItemsByMarket(marketId);

      if (items.length === 0) {
        return;
      }

      const batch = writeBatch(db);

      items.forEach((item) => {
        const docRef = doc(db, this.COLLECTION, item.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error('Failed to delete market items: ' + error.message);
    }
  }

  /**
   * Remove all instances of a library item from all shops
   * Used when deleting an item from the library
   */
  static async removeLibraryItemFromAllShops(itemLibraryId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('itemLibraryId', '==', itemLibraryId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const batch = writeBatch(db);

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error('Failed to remove library item from shops: ' + error.message);
    }
  }

  /**
   * Update stock count (for purchases or manual adjustment)
   */
  static async updateStock(shopItemId: string, newStock: number | null): Promise<void> {
    try {
      await this.updateShopItem(shopItemId, { stock: newStock });
    } catch (error: any) {
      throw new Error('Failed to update stock: ' + error.message);
    }
  }

  /**
   * Decrease stock by amount (for purchases)
   * Returns true if successful, false if insufficient stock
   */
  static async decreaseStock(shopItemId: string, amount: number): Promise<boolean> {
    try {
      const shopItem = await this.getShopItem(shopItemId);

      if (!shopItem) {
        throw new Error('Shop item not found');
      }

      // Unlimited stock
      if (shopItem.stock === null) {
        return true;
      }

      // Insufficient stock
      if (shopItem.stock < amount) {
        return false;
      }

      // Decrease stock
      await this.updateStock(shopItemId, shopItem.stock - amount);
      return true;
    } catch (error: any) {
      throw new Error('Failed to decrease stock: ' + error.message);
    }
  }
}
