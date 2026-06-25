interface Config {
  port: number;
  databaseUrl: string;
  maxUploadBytes: number;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    enabled: boolean;
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
    get enabled(): boolean {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },
};
