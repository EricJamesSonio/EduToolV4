import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@/core/database/database.provider';

import { CreateAdminDto } from './dto/create-admin.dto';
import { hashPassword } from '@/commons/utils/hash.util';

@Injectable()
export class PlatformService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  // 🔐 LOGIN
    login(password: string) {
    if (!process.env.PLATFORM_SECRET_PASSWORD) {
        throw new Error('PLATFORM_SECRET_PASSWORD not set');
    }

    if (password !== process.env.PLATFORM_SECRET_PASSWORD) {
        throw new UnauthorizedException('Invalid password');
    }

    return {
        access_token: this.jwtService.sign({
        role: 'platform_owner',
        }),
    };
    }

  // 👤 CREATE ADMIN
  async createAdmin(dto: CreateAdminDto) {
    const hashed = await hashPassword(dto.password);

    return this.db.account.create({
      data: {
        email: dto.email,
        password: hashed,
        role: 'admin',
        status: 'active',
        org_id: null,
      },
    });
  }

  async getAdmins() {
    return this.db.account.findMany({
      where: { role: 'admin' },
    });
  }

  async getAdmin(id: string) {
    const admin = await this.db.account.findUnique({
      where: { id },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    return admin;
  }

  async blockAdmin(id: string) {
    return this.db.account.update({
      where: { id },
      data: { status: 'suspended' },
    });
  }

  async unblockAdmin(id: string) {
    return this.db.account.update({
      where: { id },
      data: { status: 'active' },
    });
  }

  async resetPassword(id: string, password: string) {
    const hashed = await hashPassword(password);

    return this.db.account.update({
      where: { id },
      data: { password: hashed },
    });
  }
}