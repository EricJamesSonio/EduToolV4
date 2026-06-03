import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'
import type { CreateGradeLockSettingDto, UpdateGradeLockSettingDto } from './dto/grade-lock.dto'

@Injectable()
export class GradeLockSettingsService {
  constructor(private readonly repo: GradeLockRepository) {}

  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId)
    }

    return this.repo.createSetting(orgId, {
      name: dto.name,
      description: dto.description,
      lockType: dto.lockType,
      lock_deadline: dto.lock_deadline ? new Date(dto.lock_deadline) : null,
      deadlineDays: dto.deadlineDays ?? null,
      allowOverride: dto.allowOverride,
      is_default: dto.is_default ?? false,
    })
  }

  async getSettings(orgId: string) {
    const settings = await this.repo.findAllSettings(orgId)
    return settings.map((s) => ({
      ...s,
      used_in_classes: s._count.gradeLocks,
      _count: undefined,
    }))
  }

  async getSetting(orgId: string, settingId: string) {
    const setting = await this.repo.findSettingById(orgId, settingId)
    if (!setting) throw new NotFoundException('Grade lock setting not found')
    return { ...setting, used_in_classes: setting._count.gradeLocks, _count: undefined }
  }

  async updateSetting(orgId: string, settingId: string, dto: UpdateGradeLockSettingDto) {
    await this.getSetting(orgId, settingId)

    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId, settingId)
    }

    return this.repo.updateSetting(settingId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.lockType !== undefined && { lockType: dto.lockType }),
      ...(dto.lock_deadline !== undefined && {
        lock_deadline: dto.lock_deadline ? new Date(dto.lock_deadline) : null,
      }),
      ...(dto.deadlineDays !== undefined && { deadlineDays: dto.deadlineDays }),
      ...(dto.allowOverride !== undefined && { allowOverride: dto.allowOverride }),
      ...(dto.is_default !== undefined && { is_default: dto.is_default }),
    })
  }

  async deleteSetting(orgId: string, settingId: string) {
    await this.getSetting(orgId, settingId)

    const activeCount = await this.repo.countActiveLocksForSetting(orgId, settingId)
    if (activeCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${activeCount} class(es) are currently locked with this setting`,
      )
    }

    await this.repo.deleteLocksForSetting(orgId, settingId)
    await this.repo.deleteSetting(settingId)

    return { success: true }
  }
}
