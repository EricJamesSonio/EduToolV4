import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { UploadService } from './upload.service';

// ⚠️ PRODUCTION NOTE: these write to the container's LOCAL filesystem.
// Render (and most managed platforms) use EPHEMERAL storage — any file saved
// here is LOST on every deploy/restart and is not shared across instances.
// For production use object storage (S3/Cloudinary/etc.) or a persistent
// Render Disk mounted at /app/uploads instead of the container filesystem.
const PROFILE_UPLOADS_DIR = join(process.cwd(), 'uploads', 'profiles');
const ORG_LOGO_UPLOADS_DIR = join(process.cwd(), 'uploads', 'organizations');

// Ensure directory exists on module load
if (!existsSync(PROFILE_UPLOADS_DIR)) {
  mkdirSync(PROFILE_UPLOADS_DIR, { recursive: true });
}
if (!existsSync(ORG_LOGO_UPLOADS_DIR)) {
  mkdirSync(ORG_LOGO_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

@Controller('uploads')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile')
  @Roles('student', 'educator', 'admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, PROFILE_UPLOADS_DIR),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuid()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          cb(
            new BadRequestException(
              'Only image files (PNG, JPG, GIF, WEBP) are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('id') accountId: string,
  ) {
    const relativePath = `profiles/${file.filename}`;
    const saved = await this.uploadService.saveProfileImage(
      accountId,
      relativePath,
    );
    return { path: saved };
  }

  @Post('organization-logo')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ORG_LOGO_UPLOADS_DIR),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuid()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          cb(
            new BadRequestException(
              'Only image files (PNG, JPG, GIF, WEBP) are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadOrganizationLogo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('org_id') orgId: string,
  ) {
    const relativePath = `organizations/${file.filename}`;
    const saved = await this.uploadService.saveOrganizationLogo(
      orgId,
      relativePath,
    );
    return { logoUrl: saved };
  }
}
