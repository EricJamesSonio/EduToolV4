// backend/src/modules/room/room.controller.ts
//
// Admin-only. Every handler takes org_id from the verified JWT, never from
// the request body, so a caller can never pass another org's id.
//
// Note: there is deliberately no GET /rooms/:id. The list already carries
// everything the detail page needs, and omitting it removes the route-ordering
// hazard between a literal path and a `:param` path.

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { RoomService } from './room.service';
import { RoomNameDto, QueryRoomUsageDto } from './dto/room.dto';

@Controller('rooms')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /** Optional schoolYearId adds a per-room slotCount for the card summaries. */
  @Get()
  findAll(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.roomService.list(orgId, schoolYearId);
  }

  /** Weekly bookings for every room, or one room when roomId is supplied. */
  @Get('usage')
  getUsage(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryRoomUsageDto,
  ) {
    return this.roomService.getUsage(orgId, query.schoolYearId, query.roomId);
  }

  @Post()
  create(@CurrentUser('org_id') orgId: string, @Body() dto: RoomNameDto) {
    return this.roomService.create(orgId, dto.name);
  }

  @Patch(':id')
  rename(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: RoomNameDto,
  ) {
    return this.roomService.rename(id, orgId, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ): Promise<void> {
    await this.roomService.remove(id, orgId);
  }
}