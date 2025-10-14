import { Injectable } from '@angular/core';
import { ChatAttachment } from '../common/model/chat.types';

@Injectable({
  providedIn: 'root'
})
export class FileAttachmentService {

  /**
   * Validate file size and type
   * @param file - File to validate
   * @returns ValidationResult
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'image/',
      'application/pdf',
      'text/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds 10MB limit`
      };
    }

    // Check file type
    const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowedType) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not supported`
      };
    }

    return { isValid: true };
  }

  /**
   * Create attachment object from file
   * @param file - File to create attachment from
   * @returns ChatAttachment
   */
  createAttachmentFromFile(file: File): ChatAttachment {
    const attachment: ChatAttachment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadProgress: 0,
      isUploading: false
    };

    // Store the actual file for later upload
    (attachment as any).file = file;
    return attachment;
  }

  /**
   * Get file size in human readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon class based on file type
   * @param fileType - MIME type of the file
   * @returns PrimeNG icon class
   */
  getFileIconClass(fileType: string): string {
    if (fileType.startsWith('image/')) return 'pi-image';
    if (fileType === 'application/pdf') return 'pi-file-pdf';
    if (fileType.startsWith('text/')) return 'pi-file';
    if (fileType.includes('word')) return 'pi-file-word';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'pi-file-excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'pi-file-powerpoint';
    return 'pi-file';
  }

  /**
   * Check if file is an image
   * @param fileType - MIME type of the file
   * @returns boolean
   */
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  /**
   * Generate file preview URL for images
   * @param file - File to generate preview for
   * @returns Promise<string> - Data URL for image preview
   */
  generateImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file.type)) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
}
