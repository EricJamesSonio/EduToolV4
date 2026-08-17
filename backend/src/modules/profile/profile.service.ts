import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { MailService } from '@/modules/mail/mail.service';
import { PersonalEmailRegistryService } from '@/commons/services/personal-email-registry.service';
import { ProfileRepository } from './profile.repository';
import {
  ChangePersonalEmailVerifyDto,
  ChangePersonalEmailRequestDto,
  UpdatePersonalEmailDto,
  UpdateProfileDto,
} from './dto/profile.dto';

const PERSONAL_EMAIL_CLAIMED_MESSAGE =
  'This email was just claimed by another account. Please try a different one.';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly personalEmailRegistry: PersonalEmailRegistryService,
  ) {}

  async getProfile(accountId: string) {
    const account =
      await this.profileRepository.findAccountWithProfile(accountId);

    if (!account) {
      throw new NotFoundException('Profile not found.');
    }

    return this.toProfileResponse(account);
  }

  async updatePersonalEmail(accountId: string, dto: UpdatePersonalEmailDto) {
    const profile = await this.profileRepository.findByAccountId(accountId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const updated = await this.profileRepository.updatePersonalEmail(
      accountId,
      dto.personalEmail ?? null,
    );

    return {
      accountId,
      personalEmail: updated.personal_email ?? null,
    };
  }

  async requestPersonalEmailChange(
    accountId: string,
    dto: ChangePersonalEmailRequestDto,
  ) {
    const profile = await this.profileRepository.findByAccountId(accountId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    // Reject before wasting an OTP send: if the new Gmail already belongs to
    // another account, there is no point emailing a code that can't succeed.
    // The calling account is excluded so it can change to a brand-new value.
    if (
      await this.personalEmailRegistry.isPersonalEmailInUse(
        dto.newEmail,
        accountId,
      )
    ) {
      throw new BadRequestException(
        'This Gmail is already linked to another account in EduTool.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepository.createOtp({
      email: dto.newEmail,
      code,
      plan: null,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      purpose: OtpPurpose.personal_email_change,
    });
    await this.mailService.sendOtpEmail(dto.newEmail, code);

    return { message: 'Verification code sent to your new email' };
  }

  async verifyPersonalEmailChange(
    accountId: string,
    dto: ChangePersonalEmailVerifyDto,
  ) {
    const otp = await this.authRepository.findValidOtp(dto.newEmail, dto.code, {
      purpose: OtpPurpose.personal_email_change,
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

    // Re-check right before committing to close the window between the first
    // check and now — someone else could have claimed this email in between.
    if (
      await this.personalEmailRegistry.isPersonalEmailInUse(
        dto.newEmail,
        accountId,
      )
    ) {
      throw new BadRequestException(PERSONAL_EMAIL_CLAIMED_MESSAGE);
    }

    try {
      await this.profileRepository.updatePersonalEmail(accountId, dto.newEmail);
    } catch (error) {
      // Last-resort safety net: a genuine race that slipped past the re-check
      // surfaces as the DB unique-constraint violation. Return the same
      // friendly message instead of a raw 500.
      if ((error as { code?: string })?.code === 'P2002') {
        throw new BadRequestException(PERSONAL_EMAIL_CLAIMED_MESSAGE);
      }
      throw error;
    }

    return { accountId, personalEmail: dto.newEmail };
  }

  async updateProfile(accountId: string, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findByAccountId(accountId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    await this.profileRepository.updateProfile(accountId, {
      fullName: dto.fullName,
      personalEmail: dto.personalEmail,
      profileImage: dto.profileImage,
    });

    const account =
      await this.profileRepository.findAccountWithProfile(accountId);
    return account ? this.toProfileResponse(account) : null;
  }

  private toProfileResponse(account: {
    id: string;
    org_id: string | null;
    role: string;
    email: string;
    status: string;
    created_at: Date;
    profile?: {
      full_name: string | null;
      metadata: unknown;
      personal_email: string | null;
      profile_image: string | null;
    } | null;
  }) {
    return {
      id: account.id,
      orgId: account.org_id,
      role: account.role,
      email: account.email,
      status: account.status,
      createdAt: account.created_at,
      fullName: account.profile?.full_name ?? null,
      metadata: account.profile?.metadata ?? null,
      personalEmail: account.profile?.personal_email ?? null,
      profileImage: account.profile?.profile_image ?? null,
    };
  }
}
