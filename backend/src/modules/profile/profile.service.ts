import { Injectable, NotFoundException } from '@nestjs/common'
import { ProfileRepository } from './profile.repository'
import { UpdatePersonalEmailDto } from './dto/profile.dto'

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

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
}