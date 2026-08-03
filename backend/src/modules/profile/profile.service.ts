import { Injectable, NotFoundException } from '@nestjs/common'
import { ProfileRepository } from './profile.repository'
import { UpdatePersonalEmailDto, UpdateProfileDto } from './dto/profile.dto'

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(accountId: string) {
    const account = await this.profileRepository.findAccountWithProfile(accountId)

    if (!account) {
      throw new NotFoundException('Profile not found.')
    }

    return this.toProfileResponse(account)
  }

  async updatePersonalEmail(accountId: string, dto: UpdatePersonalEmailDto) {
    const profile = await this.profileRepository.findByAccountId(accountId)
    if (!profile) {
      throw new NotFoundException('Profile not found.')
    }

    const updated = await this.profileRepository.updatePersonalEmail(
      accountId,
      dto.personalEmail ?? null,
    )

    return {
      accountId,
      personalEmail: updated.personal_email ?? null,
    }
  }

  async updateProfile(accountId: string, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findByAccountId(accountId)
    if (!profile) {
      throw new NotFoundException('Profile not found.')
    }

    await this.profileRepository.updateProfile(accountId, {
      fullName: dto.fullName,
      personalEmail: dto.personalEmail,
      profileImage: dto.profileImage,
    })

    const account = await this.profileRepository.findAccountWithProfile(accountId)
    return account ? this.toProfileResponse(account) : null
  }

  private toProfileResponse(account: {
    id: string
    org_id: string | null
    role: string
    email: string
    status: string
    created_at: Date
    profile?: {
      full_name: string | null
      metadata: unknown
      personal_email: string | null
      profile_image: string | null
    } | null
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
    }
  }
}