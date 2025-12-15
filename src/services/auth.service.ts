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
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

  /**
   * Update display name
   */
  static async updateDisplayName(newDisplayName: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: newDisplayName });

      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
      });
    } catch (error: any) {
      throw new Error(`Failed to update display name: ${error.message}`);
    }
  }

  /**
   * Update email (requires recent authentication)
   */
  static async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update Firebase Auth email
      await updateEmail(user, newEmail);

      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
      });
    } catch (error: any) {
      throw new Error(`Failed to update email: ${error.message}`);
    }
  }

  /**
   * Update password (requires recent authentication)
   */
  static async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteAccount(password?: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Re-authenticate before deletion (required by Firebase)
      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      const userId = user.uid;

      // Delete all user data from Firestore
      // 1. Delete all items
      const itemsQuery = query(collection(db, 'items'), where('dmId', '==', userId));
      const itemsSnapshot = await getDocs(itemsQuery);
      const itemDeletePromises = itemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(itemDeletePromises);

      // 2. Delete all shops
      const shopsQuery = query(collection(db, 'shops'), where('dmId', '==', userId));
      const shopsSnapshot = await getDocs(shopsQuery);
      const shopDeletePromises = shopsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(shopDeletePromises);

      // 3. Delete all markets
      const marketsQuery = query(collection(db, 'markets'), where('dmId', '==', userId));
      const marketsSnapshot = await getDocs(marketsQuery);
      const marketDeletePromises = marketsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(marketDeletePromises);

      // 4. Delete user document
      await deleteDoc(doc(db, 'users', userId));

      // 5. Delete Firebase Auth user
      await deleteUser(user);
    } catch (error: any) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }
}
