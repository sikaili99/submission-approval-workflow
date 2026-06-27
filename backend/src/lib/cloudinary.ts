import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export interface UploadResult {
  url: string;
  name: string;
}

// Thrown when the storage provider rejects the file (e.g. an invalid image).
// The HTTP layer maps this to a 422 rather than a generic 500.
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function uploadAttachment(
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'approvals', resource_type: 'auto' },
      (error, uploaded) => {
        if (error || !uploaded) {
          const message =
            error && typeof error === 'object' && 'message' in error
              ? String((error as { message: unknown }).message)
              : 'Upload failed';
          reject(new UploadError(message));
          return;
        }
        resolve(uploaded as { secure_url: string });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, name: originalName };
}

export const isUploadEnabled = (): boolean => config.cloudinary.enabled;
