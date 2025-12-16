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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ItemLibrary, CreateItemLibraryInput } from '../types/firebase';
import { ShopItemService } from './shop-item.service';

export class ItemLibraryService {
  private static readonly COLLECTION = 'itemLibrary';
  public static readonly ITEM_LIBRARY_LIMIT = 500;
  public static readonly ITEM_LIBRARY_WARNING_THRESHOLD = 450;

  /**
   * Get count of items in a DM's library
   */
  static async getItemCount(dmId: string): Promise<number> {
    try {
      const items = await this.getItemsByDM(dmId);
      return items.length;
    } catch (error: any) {
      throw new Error('Failed to get item count: ' + error.message);
    }
  }

  /**
   * Create a new item in the user's library
   */
  static async createItem(dmId: string, input: CreateItemLibraryInput): Promise<ItemLibrary> {
    try {
      // Check item limit
      const currentCount = await this.getItemCount(dmId);
      if (currentCount >= this.ITEM_LIBRARY_LIMIT) {
        throw new Error(`You have reached the maximum limit of ${this.ITEM_LIBRARY_LIMIT} items in your library. Please delete some items before creating new ones.`);
      }

      const itemData = {
        dmId,
        item: input.item,
        source: input.source,
        officialId: input.officialId || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), itemData);

      return {
        id: docRef.id,
        ...itemData,
      };
    } catch (error: any) {
      throw new Error('Failed to create item: ' + error.message);
    }
  }

  /**
   * Get a single item from library by ID
   */
  static async getItem(itemId: string): Promise<ItemLibrary | null> {
    try {
      const docRef = doc(db, this.COLLECTION, itemId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ItemLibrary;
    } catch (error: any) {
      throw new Error('Failed to get item: ' + error.message);
    }
  }

  /**
   * Get all items in a DM's library
   */
  static async getItemsByDM(dmId: string): Promise<ItemLibrary[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('dmId', '==', dmId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ItemLibrary[];
    } catch (error: any) {
      throw new Error('Failed to get items: ' + error.message);
    }
  }

  /**
   * Get items by type (weapon, armor, consumable, etc.)
   */
  static async getItemsByType(dmId: string, itemType: string): Promise<ItemLibrary[]> {
    try {
      const allItems = await this.getItemsByDM(dmId);
      return allItems.filter(item => item.item.type === itemType);
    } catch (error: any) {
      throw new Error('Failed to get items by type: ' + error.message);
    }
  }

  /**
   * Get items by source (official, custom, modified)
   */
  static async getItemsBySource(dmId: string, source: 'official' | 'custom' | 'modified'): Promise<ItemLibrary[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('dmId', '==', dmId),
        where('source', '==', source),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ItemLibrary[];
    } catch (error: any) {
      throw new Error('Failed to get items by source: ' + error.message);
    }
  }

  /**
   * Update an item in the library
   */
  static async updateItem(itemId: string, updates: Partial<CreateItemLibraryInput>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, itemId);

      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      if (updates.item !== undefined) {
        updateData.item = updates.item;
      }
      if (updates.source !== undefined) {
        updateData.source = updates.source;
      }
      if (updates.officialId !== undefined) {
        updateData.officialId = updates.officialId;
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      throw new Error('Failed to update item: ' + error.message);
    }
  }

  /**
   * Delete an item from the library
   * WARNING: This will also remove the item from all shops that use it
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      // Remove from all shops that use this item
      await ShopItemService.removeLibraryItemFromAllShops(itemId);

      // Delete from library
      const docRef = doc(db, this.COLLECTION, itemId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error('Failed to delete item: ' + error.message);
    }
  }

  /**
   * Check if an item is used in any shops
   * Returns the count of shops using this item
   */
  static async getItemUsageCount(itemId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'shopItems'),
        where('itemLibraryId', '==', itemId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      throw new Error('Failed to check item usage: ' + error.message);
    }
  }

  /**
   * Check if an item is used in any active markets
   * Returns true if the item is in a shop of an active market
   */
  static async isItemInActiveMarket(itemId: string): Promise<boolean> {
    try {
      // Get all shop items using this library item
      const shopItemsQuery = query(
        collection(db, 'shopItems'),
        where('itemLibraryId', '==', itemId)
      );

      const shopItemsSnapshot = await getDocs(shopItemsQuery);

      if (shopItemsSnapshot.empty) {
        return false;
      }

      // Get unique market IDs
      const marketIds = new Set<string>();
      shopItemsSnapshot.docs.forEach(doc => {
        marketIds.add(doc.data().marketId);
      });

      // Check if any of these markets are active
      for (const marketId of marketIds) {
        const marketDoc = await getDoc(doc(db, 'markets', marketId));
        if (marketDoc.exists() && marketDoc.data().isActive === true) {
          return true;
        }
      }

      return false;
    } catch (error: any) {
      throw new Error('Failed to check if item is in active market: ' + error.message);
    }
  }

  /**
   * Search items by name
   */
  static async searchItemsByName(dmId: string, searchTerm: string): Promise<ItemLibrary[]> {
    try {
      const allItems = await this.getItemsByDM(dmId);
      const searchLower = searchTerm.toLowerCase();

      return allItems.filter(item =>
        item.item.name.toLowerCase().includes(searchLower)
      );
    } catch (error: any) {
      throw new Error('Failed to search items: ' + error.message);
    }
  }
}
