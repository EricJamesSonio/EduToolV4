// @/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, OtpPurpose } from '@prisma/client';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/auth.dto';
import { RegisterDto, VerifyOtpDto, ResendOtpDto } from './dto/register.dto';
import { AuthTokens, TokenPayload } from './entity/auth.entity';
import { comparePassword, hashPassword } from '@/commons/utils/hash.util';
import { MailService } from '@/modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const account = await this.authRepository.findAccountByEmail(dto.email);

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await comparePassword(dto.password, account.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

    return this.generateTokens(
      account.id,
      account.org_id,
      account.role,
      account.email,
    );
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.authRepository.findAccountByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authRepository.createOtp({
      email: dto.email,
      full_name: dto.fullName,
      code,
      plan: dto.plan ?? null,
      institution_name: dto.institutionName ?? null,
      role: dto.role ?? null,
      student_count: dto.studentCount ?? null,
      programs_departments: dto.programsDepartments ?? null,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.mailService.sendOtpEmail(dto.email, code);

    return { message: 'Verification code sent to your email' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const otp = await this.authRepository.findValidOtp(dto.email, dto.code);

    if (!otp) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (otp.used_at) {
      throw new BadRequestException('Verification code already used');
    }

    if (new Date() > otp.expires_at) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.authRepository.markOtpUsed(otp.id);

    await this.authRepository.createRegistrationRequest({
      email: dto.email,
      full_name: otp.full_name ?? dto.email,
      plan: otp.plan ?? null,
      institution_name: otp.institution_name ?? null,
      role: otp.role ?? null,
      student_count: otp.student_count ?? null,
      programs_departments: otp.programs_departments ?? null,
    });

    return { message: 'Registration request submitted for review' };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authRepository.createOtp({
      email: dto.email,
      code,
      plan: null,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.mailService.sendOtpEmail(dto.email, code);

    return { message: 'New verification code sent to your email' };
  }

  // ─── Enrollment Portal OTP (public applicants) ───────────────────────────
  // Same OTP write + send path as org registration, distinguished by
  // `purpose` + `org_id` so an applicant OTP can never satisfy an
  // org-registration verification (and vice versa).

  async sendEnrollmentOtp(
    email: string,
    orgId: string,
  ): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.authRepository.createOtp({
      email,
      code,
      plan: null,
      purpose: OtpPurpose.enrollment_verification,
      org_id: orgId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.mailService.sendOtpEmail(email, code);

    return { message: 'Verification code sent to your email' };
  }

  async verifyEnrollmentOtp(
    email: string,
    code: string,
    orgId: string,
  ): Promise<void> {
    const otp = await this.authRepository.findValidOtp(email, code, {
      purpose: OtpPurpose.enrollment_verification,
      orgId,
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (otp.used_at) {
      throw new BadRequestException('Verification code already used');
    }

    if (new Date() > otp.expires_at) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.authRepository.markOtpUsed(otp.id);
  }

  async refresh(incomingRefreshToken: string): Promise<AuthTokens> {
    let accountId: string;
    try {
      const payload = this.jwtService.decode(incomingRefreshToken) as {
        sub: string;
      };
      if (!payload?.sub) throw new Error();
      accountId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

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

    return this.generateTokens(
      account.id,
      account.org_id,
      account.role,
      account.email,
    );
  }

  async logout(accountId: string): Promise<void> {
    await this.authRepository.clearRefreshToken(accountId);
  }

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
      personalEmail: account.profile?.personal_email ?? null,
      profileImage: account.profile?.profile_image ?? null,
      isRegistrar: account.is_registrar ?? false,
    };
  }

  private async generateTokens(
    accountId: string,
    org_id: string | null,
    role: any,
    email: string,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: accountId,
      org_id,
      role,
      email,
    };

    const accessToken = this.jwtService.sign(payload as any, {
      expiresIn: (this.configService.get<string>('jwt.expiresIn') ??
        '1h') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '7d',
    });

    const hashedRefreshToken = await hashPassword(refreshToken);
    await this.authRepository.saveRefreshToken(accountId, hashedRefreshToken);

    return { accessToken, refreshToken };
  }
}
