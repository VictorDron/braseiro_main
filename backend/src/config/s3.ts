import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from './index';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: true,
});

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<string> {
  const ext = originalName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const key = fileUrl.replace(`${config.s3.endpoint}/${config.s3.bucket}/`, '');
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    })
  );
}

export { s3Client };
