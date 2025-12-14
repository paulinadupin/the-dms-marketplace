import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { DMUser } from '../types/firebase';

export class AuthService {
  /**
   * Register a new DM account
   */
  static async registerDM(email: string, password: string, displayName: string): Promise<DMUser> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create DM user document in Firestore
      const dmUser: DMUser = {
        id: user.uid,
        email: user.email!,
        displayName,
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'users', user.uid), dmUser);

      return dmUser;
    } catch (error: any) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Sign in DM
   */
  static async signIn(email: string, password: string): Promise<DMUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch DM data from Firestore
      const dmDoc = await getDoc(doc(db, 'users', user.uid));

      if (!dmDoc.exists()) {
        throw new Error('User profile not found');
      }

      return dmDoc.data() as DMUser;
    } catch (error: any) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get DM profile from Firestore
   */
  static async getDMProfile(userId: string): Promise<DMUser | null> {
    const dmDoc = await getDoc(doc(db, 'users', userId));

    if (!dmDoc.exists()) {
      return null;
    }

    return dmDoc.data() as DMUser;
  }
}
