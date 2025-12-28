import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../config/firebase';

/**
 * Service for managing item image uploads and storage in Firebase Storage
 */
export class StorageService {
  /**
   * Compress an image file to reduce size for storage and bandwidth
   * Target: 50-80KB for optimal performance within Firebase free tier
   */
  private static async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.08, // Target 80KB
      maxWidthOrHeight: 800, // Sufficient for thumbnails and modals
      useWebWorker: true, // Non-blocking compression
      fileType: 'image/jpeg', // Best compression ratio
      initialQuality: 0.85, // Balance quality and size
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log('Image compressed:', {
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        compressionRatio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
      });
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image. Please try again.');
    }
  }

  /**
   * Validate file type and size before upload
   */
  private static validateFile(file: File): void {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload PNG, JPG, WEBP, or GIF images only.');
    }

    // Check file size (2MB max before compression)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 2MB limit. Please choose a smaller image.');
    }
  }

  /**
   * Upload an item image to Firebase Storage with compression
   *
   * @param dmId - DM's user ID (owner of the item)
   * @param itemId - Unique item ID
   * @param file - Image file to upload
   * @returns Download URL for the uploaded image
   */
  static async uploadItemImage(dmId: string, itemId: string, file: File): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);

      // Compress image
      const compressedFile = await this.compressImage(file);

      // Generate storage path: /items/{dmId}/{itemId}/image.{ext}
      const fileExtension = compressedFile.type.split('/')[1] || 'jpg';
      const storagePath = `items/${dmId}/${itemId}/image.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, compressedFile, {
        contentType: compressedFile.type,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      });

      // Get and return download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      if (error.message) {
        throw error; // Re-throw validation errors
      }
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  /**
   * Delete an item image from Firebase Storage
   *
   * @param imageUrl - Full download URL of the image to delete
   */
  static async deleteItemImage(imageUrl: string): Promise<void> {
    try {
      // Extract storage path from URL
      const storageRef = ref(storage, imageUrl);

      // Delete from storage
      await deleteObject(storageRef);
      console.log('Image deleted successfully:', imageUrl);
    } catch (error: any) {
      // Don't throw error if image doesn't exist (already deleted)
      if (error.code === 'storage/object-not-found') {
        console.warn('Image not found (may already be deleted):', imageUrl);
        return;
      }

      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image.');
    }
  }

  /**
   * Get file extension from a File object
   */
  static getFileExtension(file: File): string {
    return file.type.split('/')[1] || 'jpg';
  }

  /**
   * Check if a URL is a Firebase Storage URL
   */
  static isFirebaseStorageUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }
}
