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
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: localUri,
      name: filename,
      type,
    } as any);

    return apiClient.upload<UploadedPhoto>('/api/photos/upload', formData);
  }
}

export const mediaDAO = new MediaDAOImpl();
