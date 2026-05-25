import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ImageStorageService {
  private readonly uploadDir = join(__dirname, '..', '..', '..', '..', 'uploads', 'images');

  async upload(file: Express.Multer.File): Promise<string> {
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      return this.uploadToCloudinary(file);
    }

    return this.uploadLocally(file);
  }

  private async uploadLocally(file: Express.Multer.File): Promise<string> {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }

    const ext = file.originalname.split('.').pop() || 'png';
    const filename = `${uuid()}.${ext}`;
    const filepath = join(this.uploadDir, filename);

    await writeFile(filepath, file.buffer);

    return `/uploads/images/${filename}`;
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.round(Date.now() / 1000);
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(signatureStr).digest('hex');

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('api_key', apiKey);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );

    const data = await res.json();
    return data.secure_url || data.url;
  }
}
