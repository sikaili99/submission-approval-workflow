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

export async function uploadAttachment(
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'approvals', resource_type: 'auto' },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error('Upload failed'));
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
