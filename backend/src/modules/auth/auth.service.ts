import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, comparePassword } from '@/commons/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(
    private repo: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async register(dto: any) {
    const existing = await this.repo.findByEmail(dto.email);

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashed = await hashPassword(dto.password);

    return this.repo.createAccount({
      email: dto.email,
      password: hashed,
      full_name: dto.full_name,
    });
  }

  async login(dto: any) {
    const account = await this.repo.findByEmail(dto.email);

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await comparePassword(
      dto.password,
      account.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: account.id,
      role: account.role,
      orgId: account.org_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: string) {
    return this.repo.findById(userId);
  }
}