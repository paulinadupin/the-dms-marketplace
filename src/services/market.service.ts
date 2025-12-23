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
import type { Market, CreateMarketInput } from '../types/firebase';
import { ShopItemService } from './shop-item.service';
import { SessionStockService } from './session-stock.service';

export class MarketService {
  private static readonly COLLECTION = 'markets';

  /**
   * Generate a unique access code for market URL
   */
  private static generateAccessCode(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${slug}-${randomId}`;
  }

  /**
   * Create a new market
   */
  static async createMarket(dmId: string, input: CreateMarketInput): Promise<Market> {
    try {
      const accessCode = this.generateAccessCode(input.name);

      const marketData = {
        name: input.name,
        description: input.description,
        dmId,
        accessCode,
        isActive: false,
        activeUntil: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), marketData);

      return {
        id: docRef.id,
        ...marketData,
      };
    } catch (error: any) {
      throw new Error(`Failed to create market: ${error.message}`);
    }
  }

  /**
   * Get a market by ID
   */
  static async getMarket(marketId: string): Promise<Market | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, marketId));

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Market;
    } catch (error: any) {
      throw new Error(`Failed to get market: ${error.message}`);
    }
  }

  /**
   * Get market by access code (for player URL)
   */
  static async getMarketByAccessCode(accessCode: string): Promise<Market | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('accessCode', '==', accessCode),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Market;
    } catch (error: any) {
      throw new Error(`Failed to get market by code: ${error.message}`);
    }
  }

  /**
   * Get all markets for a DM
   */
  static async getMarketsByDM(dmId: string): Promise<Market[]> {
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
      })) as Market[];
    } catch (error: any) {
      throw new Error(`Failed to get markets: ${error.message}`);
    }
  }

  /**
   * Update a market
   */
  static async updateMarket(
    marketId: string,
    updates: Partial<Omit<Market, 'id' | 'dmId' | 'createdAt' | 'accessCode'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, marketId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to update market: ${error.message}`);
    }
  }

  /**
   * Get the currently active market for a DM (if any)
   */
  static async getActiveMarket(dmId: string): Promise<Market | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('dmId', '==', dmId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const marketDoc = querySnapshot.docs[0];
      const market = {
        id: marketDoc.id,
        ...marketDoc.data(),
      } as Market;

      // Check if expired
      if (market.activeUntil) {
        const now = Timestamp.now();
        if (market.activeUntil.toMillis() < now.toMillis()) {
          // Auto-deactivate expired market
          await this.deactivateMarket(market.id);
          return null;
        }
      }

      return market;
    } catch (error: any) {
      throw new Error(`Failed to get active market: ${error.message}`);
    }
  }

  /**
   * Activate a market (only one can be active at a time per DM)
   * Sets 3-hour time limit
   */
  static async activateMarket(marketId: string, dmId: string): Promise<void> {
    try {
      // Check if another market is already active
      const activeMarket = await this.getActiveMarket(dmId);
      if (activeMarket && activeMarket.id !== marketId) {
        throw new Error('You already have an active market. Please deactivate it first.');
      }

      // Set active until 3 hours from now
      const now = Timestamp.now();
      const threeHoursInMs = 3 * 60 * 60 * 1000;
      const activeUntil = Timestamp.fromMillis(now.toMillis() + threeHoursInMs);

      await updateDoc(doc(db, this.COLLECTION, marketId), {
        isActive: true,
        activeUntil: activeUntil,
        updatedAt: now,
      });

      // Initialize session stock for all items in this market
      await SessionStockService.initializeMarketSession(marketId);
    } catch (error: any) {
      throw new Error(`Failed to activate market: ${error.message}`);
    }
  }

  /**
   * Deactivate a market and reset all item stock to original values
   */
  static async deactivateMarket(marketId: string): Promise<void> {
    try {
      // Clear session stock for this market
      await SessionStockService.clearMarketSession(marketId);

      // Reset all stock in the market to original values
      await ShopItemService.resetStockInMarket(marketId);

      // Deactivate the market
      await updateDoc(doc(db, this.COLLECTION, marketId), {
        isActive: false,
        activeUntil: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to deactivate market: ${error.message}`);
    }
  }

  /**
   * Toggle market active status
   * @deprecated Use activateMarket() or deactivateMarket() instead
   */
  static async toggleMarketActive(marketId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, marketId), {
        isActive,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to toggle market: ${error.message}`);
    }
  }

  /**
   * Delete a market and all its shops
   * NOTE: Deletes shop items (references) but NOT library items (catalog preserved)
   */
  static async deleteMarket(marketId: string): Promise<void> {
    try {
      // Delete all shop items (references) in this market
      await ShopItemService.deleteAllItemsInMarket(marketId);

      // Delete all shops in this market
      const shopsQuery = query(
        collection(db, 'shops'),
        where('marketId', '==', marketId)
      );
      const shopsSnapshot = await getDocs(shopsQuery);
      const shopDeletePromises = shopsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(shopDeletePromises);

      // Delete the market document
      await deleteDoc(doc(db, this.COLLECTION, marketId));

      // NOTE: Library items are preserved - they remain in user's item library for reuse
    } catch (error: any) {
      throw new Error(`Failed to delete market: ${error.message}`);
    }
  }

  /**
   * Get shareable URL for a market
   */
  static getShareableURL(accessCode: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/market/${accessCode}`;
  }
}
