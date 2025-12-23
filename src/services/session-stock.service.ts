import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SessionStock } from '../types/firebase';
import { ShopItemService } from './shop-item.service';

export class SessionStockService {
  private static readonly COLLECTION = 'sessionStock';

  /**
   * Initialize session stock for all items in a market when it activates
   */
  static async initializeMarketSession(marketId: string): Promise<void> {
    try {
      const shopItems = await ShopItemService.getItemsByMarket(marketId);
      const batch = writeBatch(db);

      for (const shopItem of shopItems) {
        const sessionStockId = `${marketId}_${shopItem.id}`;
        const sessionStockRef = doc(db, this.COLLECTION, sessionStockId);

        const sessionStockData = {
          marketId,
          shopItemId: shopItem.id,
          currentStock: shopItem.stock, // Initialize with current shop item stock
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        batch.set(sessionStockRef, sessionStockData);
      }

      await batch.commit();
    } catch (error: any) {
      throw new Error('Failed to initialize session stock: ' + error.message);
    }
  }

  /**
   * Clear all session stock for a market when it deactivates
   */
  static async clearMarketSession(marketId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error('Failed to clear session stock: ' + error.message);
    }
  }

  /**
   * Get session stock for a specific shop item
   */
  static async getSessionStock(marketId: string, shopItemId: string): Promise<SessionStock | null> {
    try {
      const sessionStockId = `${marketId}_${shopItemId}`;
      const docRef = doc(db, this.COLLECTION, sessionStockId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SessionStock;
    } catch (error: any) {
      throw new Error('Failed to get session stock: ' + error.message);
    }
  }

  /**
   * Get all session stock for a market
   */
  static async getMarketSessionStock(marketId: string): Promise<SessionStock[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SessionStock[];
    } catch (error: any) {
      throw new Error('Failed to get market session stock: ' + error.message);
    }
  }

  /**
   * Decrease session stock (called when player purchases)
   * Returns true if successful, false if insufficient stock
   */
  static async decreaseStock(marketId: string, shopItemId: string, amount: number = 1): Promise<boolean> {
    try {
      const sessionStock = await this.getSessionStock(marketId, shopItemId);

      if (!sessionStock) {
        // No session stock means unlimited or error
        return true;
      }

      // Unlimited stock
      if (sessionStock.currentStock === null) {
        return true;
      }

      // Insufficient stock
      if (sessionStock.currentStock < amount) {
        return false;
      }

      // Decrease stock
      const sessionStockId = `${marketId}_${shopItemId}`;
      const docRef = doc(db, this.COLLECTION, sessionStockId);

      await updateDoc(docRef, {
        currentStock: sessionStock.currentStock - amount,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error: any) {
      throw new Error('Failed to decrease session stock: ' + error.message);
    }
  }
}
