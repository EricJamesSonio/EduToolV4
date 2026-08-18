// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: backend/src/modules/meeting/meeting-token.controller.ts  (new)
// ─────────────────────────────────────────────────────────────────────────────
//
// GET /meetings/:id/token
// Returns an Agora RTC token for the current user to join the video room.
//

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AgoraTokenService } from './agora-token.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('meetings')
@UseGuards(AuthGuard, RolesGuard)
export class MeetingTokenController {
  constructor(private readonly agoraTokenService: AgoraTokenService) {}

  @Get(':id/token')
  @Roles('educator', 'student')
  getToken(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.agoraTokenService.getToken(id, orgId, userId, role);
  }
}
