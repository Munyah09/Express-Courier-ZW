import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || '4000',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refreshsecret',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://mufasa:secret@localhost:5432/mufasa',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
    secretKey: process.env.MINIO_SECRET_KEY || 'minio123',
    bucket: process.env.MINIO_BUCKET_NAME || 'mufasa-assets'
  }
};
