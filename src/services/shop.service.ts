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
import type { FirestoreShop, CreateShopInput } from '../types/firebase';
import type { Currency } from '../types/currency';
import { ShopItemService } from './shop-item.service';

export class ShopService {
  private static readonly COLLECTION = 'shops';

  /**
   * Create a new shop in a market
   */
  static async createShop(input: CreateShopInput): Promise<FirestoreShop> {
    try {
      // Get current shop count for this market to set order
      const existingShops = await this.getShopsByMarket(input.marketId);

      const shopData = {
        marketId: input.marketId,
        name: input.name,
        description: input.description,
        location: input.location,
        category: input.category,
        shopkeeper: input.shopkeeper || '',
        currency: { cp: 0, sp: 0, gp: 0 } as Currency,
        tags: input.tags || [],
        order: existingShops.length,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), shopData);

      return {
        id: docRef.id,
        ...shopData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create shop: ${error.message}`);
    }
  }

  /**
   * Get a shop by ID
   */
  static async getShop(shopId: string): Promise<FirestoreShop | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, shopId));

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as FirestoreShop;
    } catch (error: any) {
      throw new Error(`Failed to get shop: ${error.message}`);
    }
  }

  /**
   * Get all shops in a market
   */
  static async getShopsByMarket(marketId: string): Promise<FirestoreShop[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId),
        orderBy('order', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreShop[];
    } catch (error: any) {
      throw new Error(`Failed to get shops: ${error.message}`);
    }
  }

  /**
   * Update a shop
   */
  static async updateShop(
    shopId: string,
    updates: Partial<Omit<FirestoreShop, 'id' | 'marketId' | 'createdAt'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, shopId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to update shop: ${error.message}`);
    }
  }

  /**
   * Update shop currency (when players buy/sell)
   */
  static async updateShopCurrency(shopId: string, currency: Currency): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, shopId), {
        currency,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to update shop currency: ${error.message}`);
    }
  }

  /**
   * Reorder shops in a market
   */
  static async reorderShops(shopUpdates: { id: string; order: number }[]): Promise<void> {
    try {
      const promises = shopUpdates.map(({ id, order }) =>
        updateDoc(doc(db, this.COLLECTION, id), { order, updatedAt: Timestamp.now() })
      );

      await Promise.all(promises);
    } catch (error: any) {
      throw new Error(`Failed to reorder shops: ${error.message}`);
    }
  }

  /**
   * Delete a shop
   * NOTE: Deletes shop items (references) but NOT library items (catalog preserved)
   */
  static async deleteShop(shopId: string): Promise<void> {
    try {
      // Delete all shop items (references to library items)
      await ShopItemService.deleteAllItemsInShop(shopId);

      // Delete the shop document
      await deleteDoc(doc(db, this.COLLECTION, shopId));
    } catch (error: any) {
      throw new Error(`Failed to delete shop: ${error.message}`);
    }
  }
}
