// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/auth.dto';
import { AuthTokens, TokenPayload } from './entity/auth.entity';
import { comparePassword, hashPassword } from 'src/commons/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokens> {
    const account = await this.authRepository.findAccountByEmail(dto.email);

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await comparePassword(dto.password, account.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block inactive statuses from logging in
    const blockedStatuses: AccountStatus[] = [
      AccountStatus.suspended,
      AccountStatus.dropped,
      AccountStatus.transferred,
      AccountStatus.graduated,
      AccountStatus.pending,
    ];

    if (blockedStatuses.includes(account.status)) {
      throw new ForbiddenException(
        `Account is ${account.status}. Contact your administrator.`,
      );
    }

    const tokens = await this.generateTokens(account.id, account.org_id, account.role, account.email);
    return tokens;
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(accountId: string, incomingRefreshToken: string): Promise<AuthTokens> {
    const storedHash = await this.authRepository.getRefreshToken(accountId);

    if (!storedHash) {
      throw new UnauthorizedException('No active session');
    }

    const isValid = await comparePassword(incomingRefreshToken, storedHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const account = await this.authRepository.findAccountById(accountId);
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    const tokens = await this.generateTokens(account.id, account.org_id, account.role, account.email);
    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(accountId: string): Promise<void> {
    await this.authRepository.clearRefreshToken(accountId);
  }

  // ─── Me ───────────────────────────────────────────────────────────────────

  async getMe(accountId: string) {
    const account = await this.authRepository.findAccountById(accountId);

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      id: account.id,
      orgId: account.org_id,
      role: account.role,
      email: account.email,
      status: account.status,
      fullName: account.profile?.full_name ?? null,
      metadata: account.profile?.metadata ?? null,
      createdAt: account.created_at,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateTokens(
    accountId: string,
    orgId: string | null,
    role: any,
    email: string,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: accountId,
      orgId,
      role,
      email,
    };

const accessToken = this.jwtService.sign(payload as any, {
  expiresIn: (this.configService.get<string>('jwt.expiresIn') ?? '1h') as any,
});

    // Refresh token is a longer-lived JWT; we only store its hash
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '7d',
    });

    const hashedRefreshToken = await hashPassword(refreshToken);
    await this.authRepository.saveRefreshToken(accountId, hashedRefreshToken);

    return { accessToken, refreshToken };
  }
}