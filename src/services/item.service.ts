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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FirestoreItem, CreateItemInput } from '../types/firebase';

export class ItemService {
  private static readonly COLLECTION = 'items';

  /**
   * Create a new item in a shop
   */
  static async createItem(input: CreateItemInput): Promise<FirestoreItem> {
    try {
      const itemData = {
        ...input.item,
        shopId: input.shopId,
        marketId: input.marketId,
        stock: input.stock ?? null,
        priceModifier: input.priceModifier,
        source: input.source,
        officialId: input.officialId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), itemData);

      return {
        id: docRef.id,
        ...itemData,
      } as FirestoreItem;
    } catch (error: any) {
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  /**
   * Get an item by ID
   */
  static async getItem(itemId: string): Promise<FirestoreItem | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, itemId));

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as FirestoreItem;
    } catch (error: any) {
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Get all items in a shop
   */
  static async getItemsByShop(shopId: string): Promise<FirestoreItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('shopId', '==', shopId),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreItem[];
    } catch (error: any) {
      throw new Error(`Failed to get items: ${error.message}`);
    }
  }

  /**
   * Get all items in a market
   */
  static async getItemsByMarket(marketId: string): Promise<FirestoreItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreItem[];
    } catch (error: any) {
      throw new Error(`Failed to get items by market: ${error.message}`);
    }
  }

  /**
   * Update an item
   */
  static async updateItem(
    itemId: string,
    updates: Partial<Omit<FirestoreItem, 'id' | 'shopId' | 'marketId' | 'createdAt'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, itemId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  /**
   * Decrease stock when item is purchased (atomic transaction)
   * Returns true if purchase successful, false if out of stock
   */
  static async decreaseStock(itemId: string, quantity: number = 1): Promise<boolean> {
    try {
      const itemRef = doc(db, this.COLLECTION, itemId);

      return await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('Item not found');
        }

        const item = itemDoc.data() as FirestoreItem;

        // If stock is null, it's unlimited
        if (item.stock === null) {
          return true;
        }

        // Check if enough stock
        if (item.stock < quantity) {
          return false; // Out of stock
        }

        // Decrease stock
        transaction.update(itemRef, {
          stock: item.stock - quantity,
          updatedAt: Timestamp.now(),
        });

        return true;
      });
    } catch (error: any) {
      throw new Error(`Failed to decrease stock: ${error.message}`);
    }
  }

  /**
   * Increase stock (e.g., if DM restocks or player sells back)
   */
  static async increaseStock(itemId: string, quantity: number = 1): Promise<void> {
    try {
      const itemRef = doc(db, this.COLLECTION, itemId);

      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('Item not found');
        }

        const item = itemDoc.data() as FirestoreItem;

        // If stock is null (unlimited), don't change it
        if (item.stock === null) {
          return;
        }

        // Increase stock
        transaction.update(itemRef, {
          stock: item.stock + quantity,
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to increase stock: ${error.message}`);
    }
  }

  /**
   * Set stock to a specific value
   */
  static async setStock(itemId: string, stock: number | null): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, itemId), {
        stock,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to set stock: ${error.message}`);
    }
  }

  /**
   * Delete an item
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, itemId));
    } catch (error: any) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Duplicate an item (useful for copying official items to customize)
   */
  static async duplicateItem(itemId: string): Promise<FirestoreItem> {
    try {
      const originalItem = await this.getItem(itemId);

      if (!originalItem) {
        throw new Error('Original item not found');
      }

      // Create a copy
      const { id, createdAt, ...itemData } = originalItem;

      const duplicateData = {
        ...itemData,
        name: `${itemData.name} (Copy)`,
        source: 'custom' as const,
        officialId: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), duplicateData);

      return {
        id: docRef.id,
        ...duplicateData,
      } as FirestoreItem;
    } catch (error: any) {
      throw new Error(`Failed to duplicate item: ${error.message}`);
    }
  }
}
