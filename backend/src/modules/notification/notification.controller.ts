// @/modules/notification/notification.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { NotificationEventsService } from './notification-events.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

const HEARTBEAT_MS = 25_000;

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly events: NotificationEventsService,
  ) {}

  /**
   * GET /notifications/stream
   * Server-sent events: pushes every new notification for the current user
   * the moment it is created.
   */
  @Get('stream')
  async stream(
    @CurrentUser('id') accountId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('retry: 5000\n\n');

    const subscription = this.events.streamFor(accountId).subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, HEARTBEAT_MS);

    req.on('close', () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
    });
  }

  /**
   * GET /notifications
   * Returns active (non-archived) notifications for the current user.
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
   * GET /notifications/summary
   * Unread total + unread count per type. Drives the red bell badge and the
   * grouped "5 new concerns / 10 new applications" rows.
   */
  @Get('summary')
  async summary(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.notificationService.getSummary(accountId, orgId);
  }

  /**
   * PATCH /notifications/read-all
   * Marks every unread notification for the current user as read.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(
    @CurrentUser('id') accountId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    await this.notificationService.markAllRead(accountId, orgId);
  }

  /**
   * PATCH /notifications/:id/read
   * Marks a single notification as read (owner only).
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @Param('id') id: string,
    @CurrentUser('id') accountId: string,
  ) {
    await this.notificationService.markRead(id, accountId);
  }

  /**
   * DELETE /notifications/:id
   * Dismisses (hard deletes) a notification.
   * Users can only dismiss their own.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismiss(@Param('id') id: string, @CurrentUser('id') accountId: string) {
    await this.notificationService.dismiss(id, accountId);
  }
}