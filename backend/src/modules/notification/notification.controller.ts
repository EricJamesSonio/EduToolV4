// @/modules/notification/notification.controller.ts
import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications
   * Returns all active (non-archived) notifications for the current user.
   * Supports ?unreadOnly=true
   * All roles — each user sees only their own notifications.
   */
  @Get()
  async findAll(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationService.findForUser(accountId, orgId, query);
  }

  /**
   * DELETE /notifications/:id
   * Dismisses (hard deletes) a notification.
   * Users can only dismiss their own.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismiss(
    @Param('id') id: string,
    @CurrentUser('id') accountId: string,
  ) {
    await this.notificationService.dismiss(id, accountId);
  }
}