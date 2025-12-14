import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup,
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

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<DMUser> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists
      let dmDoc = await getDoc(doc(db, 'users', user.uid));

      if (!dmDoc.exists()) {
        // Create new DM profile for Google user
        const dmUser: DMUser = {
          id: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          createdAt: Timestamp.now(),
        };

        await setDoc(doc(db, 'users', user.uid), dmUser);
        return dmUser;
      }

      return dmDoc.data() as DMUser;
    } catch (error: any) {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Confirm password reset with code from email
   */
  static async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error: any) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}
