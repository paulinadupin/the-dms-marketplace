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
        isActive: true,
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
   * Toggle market active status
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
   * Delete a market (and all its shops and items)
   * WARNING: This is destructive!
   */
  static async deleteMarket(marketId: string): Promise<void> {
    try {
      // TODO: Also delete all shops and items in this market
      // For now, just delete the market document
      await deleteDoc(doc(db, this.COLLECTION, marketId));
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
