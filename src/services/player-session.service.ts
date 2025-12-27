import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  arrayUnion,
  updateDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Transaction {
  type: 'buy' | 'sell' | 'end_session';
  itemName: string;
  quantity: number;
  timestamp: Timestamp;
}

export interface PlayerSession {
  id: string;
  marketId: string;
  playerName: string;
  enteredAt: Timestamp;
  lastActiveAt: Timestamp;
  transactions: Transaction[];
}

export class PlayerSessionService {
  private static readonly COLLECTION = 'playerSessions';

  /**
   * Create or update a player session when they enter a market
   */
  static async createSession(
    marketId: string,
    playerName: string
  ): Promise<string> {
    try {
      const sessionId = `${marketId}_${playerName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const sessionData = {
        marketId,
        playerName,
        enteredAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        transactions: [],
      };

      await setDoc(doc(db, this.COLLECTION, sessionId), sessionData);
      return sessionId;
    } catch (error: any) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Add a transaction (buy, sell, or end_session) to a player's session
   */
  static async addTransaction(
    sessionId: string,
    type: 'buy' | 'sell' | 'end_session',
    itemName: string = '',
    quantity: number = 1
  ): Promise<void> {
    try {
      const transaction: Transaction = {
        type,
        itemName,
        quantity,
        timestamp: Timestamp.now(),
      };

      await updateDoc(doc(db, this.COLLECTION, sessionId), {
        transactions: arrayUnion(transaction),
        lastActiveAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to add transaction: ${error.message}`);
    }
  }

  /**
   * Subscribe to real-time updates for all active player sessions in a market
   */
  static subscribeToMarketSessions(
    marketId: string,
    callback: (sessions: PlayerSession[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION),
      where('marketId', '==', marketId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions: PlayerSession[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlayerSession[];

        // Sort by most recent activity
        sessions.sort((a, b) => b.lastActiveAt.toMillis() - a.lastActiveAt.toMillis());

        callback(sessions);
      },
      (error) => {
        console.error('Error listening to player sessions:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Get all sessions for a market (one-time fetch)
   */
  static async getMarketSessions(marketId: string): Promise<PlayerSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId)
      );

      const snapshot = await getDocs(q);
      const sessions: PlayerSession[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PlayerSession[];

      return sessions.sort((a, b) => b.lastActiveAt.toMillis() - a.lastActiveAt.toMillis());
    } catch (error: any) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }
  }

  /**
   * Format transactions for display (e.g., "+Sword, -Potion")
   */
  static formatTransactions(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return 'No activity yet';
    }

    const formatted = transactions.map((t) => {
      if (t.type === 'end_session') {
        return '❮';
      }
      const prefix = t.type === 'buy' ? '+' : '-';
      const qty = t.quantity > 1 ? ` (${t.quantity})` : '';
      return `${prefix}${t.itemName}${qty}`;
    });

    return formatted.join(', ');
  }

  /**
   * Delete all player sessions for a market (called when market is deactivated)
   */
  static async deleteMarketSessions(marketId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('marketId', '==', marketId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delete sessions: ${error.message}`);
    }
  }
}
