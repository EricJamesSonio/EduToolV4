import {
  Injectable,
  ConflictException,
  NotFoundException, BadRequestException
} from '@nestjs/common';
import { GradeLockRepository } from './grade-lock.repository';
import { parseInstant } from '@/commons/utils/datetime.util';
import type {
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
} from './dto/grade-lock.dto';

@Injectable()
export class GradeLockSettingsService {
  constructor(private readonly repo: GradeLockRepository) {}
    private async assertDeadlineAllowed(
    orgId: string,
    deadline?: string | null,
  ): Promise<void> {
    if (!deadline) return;
    // TICK-INFRA-017: DTO guarantees Z/offset via @IsInstant; floor is a
    // stored Date (already a true instant) — direct comparison, no parsing.
    const floor = await this.repo.findDeadlineFloor(orgId);
    if (floor && parseInstant(deadline) < floor) {
      throw new BadRequestException(
        `Lock deadline cannot be before the end of the school year (${floor.toISOString()})`,
      );
    }
  }

  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
        await this.assertDeadlineAllowed(orgId, dto.lock_deadline);
    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId);
    }

    return this.repo.createSetting(orgId, {
      name: dto.name,
      description: dto.description,
      lockType: dto.lockType,
      // TICK-INFRA-018: same strict boundary as update (was a missed site).
      lock_deadline: dto.lock_deadline ? parseInstant(dto.lock_deadline) : null,
      deadlineDays: dto.deadlineDays ?? null,
      allowOverride: dto.allowOverride,
      is_default: dto.is_default ?? false,
    });
  }

  async getSettings(orgId: string) {
    const settings = await this.repo.findAllSettings(orgId);
    return settings.map((s) => ({
      ...s,
      used_in_classes: s._count.gradeLocks,
      _count: undefined,
    }));
  }

  async getSetting(orgId: string, settingId: string) {
    const setting = await this.repo.findSettingById(orgId, settingId);
    if (!setting) throw new NotFoundException('Grade lock setting not found');
    return {
      ...setting,
      used_in_classes: setting._count.gradeLocks,
      _count: undefined,
    };
  }

  async updateSetting(
    orgId: string,
    settingId: string,
    dto: UpdateGradeLockSettingDto,
  ) {
    await this.getSetting(orgId, settingId);
        await this.assertDeadlineAllowed(orgId, dto.lock_deadline);

    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId, settingId);
    }

    return this.repo.updateSetting(settingId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.lockType !== undefined && { lockType: dto.lockType }),
      ...(dto.lock_deadline !== undefined && {
        // TICK-INFRA-017: undefined skipped above; null clears, else parse.
        lock_deadline: dto.lock_deadline ? parseInstant(dto.lock_deadline) : null,
      }),
      ...(dto.deadlineDays !== undefined && { deadlineDays: dto.deadlineDays }),
      ...(dto.allowOverride !== undefined && {
        allowOverride: dto.allowOverride,
      }),
      ...(dto.is_default !== undefined && { is_default: dto.is_default }),
    });
  }

  async deleteSetting(orgId: string, settingId: string) {
    await this.getSetting(orgId, settingId);

    const activeCount = await this.repo.countActiveLocksForSetting(
      orgId,
      settingId,
    );
    if (activeCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${activeCount} class(es) are currently locked with this setting`,
      );
    }

    await this.repo.deleteLocksForSetting(orgId, settingId);
    await this.repo.deleteSetting(settingId);

    return { success: true };
  }
}
