import { apiClient } from '../api/apiClient';

interface UploadedPhoto {
  key: string;
  url: string;
}

class MediaDAOImpl {
  /**
   * Uploads a local image file to the media-service.
   * Returns the storage key and public URL for the uploaded photo.
   */
  async uploadPhoto(localUri: string): Promise<UploadedPhoto> {
    const formData = new FormData();
    const filename = localUri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';

    // Map file extension to MIME type — iOS can produce heic, webp, or jpeg
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
      webp: 'image/webp',
    };
    const type = mimeTypes[ext] || 'image/jpeg';

    formData.append('photo', {
      uri: localUri,
      name: filename,
      type,
    } as any);

    return apiClient.upload<UploadedPhoto>('/api/photos/upload', formData);
  }
}

export const mediaDAO = new MediaDAOImpl();
