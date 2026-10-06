import { S3Storage } from 'coze-coding-dev-sdk';

// 对象存储服务：保存学生上传的答题卡图片
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function uploadImage(buffer: Buffer, mimeType: string, originalName: string): Promise<{ key: string; url: string }> {
  // 合法文件名校验与规范化
  const safeName = (originalName || 'answer-sheet.jpg')
    .replace(/[^\w./-]/g, '_')
    .replace(/^[/]+|[/]+$/g, '')
    .replace(/\/{2,}/g, '/') || 'answer-sheet.jpg';

  const key = await storage.uploadFile({
    fileContent: buffer,
    fileName: `answer-sheets/${Date.now()}-${safeName}`,
    contentType: mimeType || 'image/jpeg',
  });

  const url = await storage.generatePresignedUrl({ key, expireTime: 2592000 }); // 30 天
  return { key, url };
}