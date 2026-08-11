import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupyService } from './groupy.service';
import { GiphyService } from './giphy.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import {
  SendGroupyMessageDto,
  ListMessagesQueryDto,
  SetReactionDto,
  CreatePollDto,
  VotePollDto,
  ReportReadDto,
  StartMeetingDto,
} from './dto/groupy.dto';

@Controller('groupy')
@UseGuards(AuthGuard, RolesGuard)
@Roles('educator', 'student')
export class GroupyController {
  constructor(
    private readonly groupyService: GroupyService,
    private readonly giphyService: GiphyService,
  ) {}

  @Get('gif-search')
  searchGifs(@Query('q') q: string) {
    return this.giphyService.search(q);
  }

  @Get('stickers')
  stickers() {
    return this.groupyService.getStickers();
  }

  @Get(':classId/messages')
  listMessages(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.groupyService.listMessages(
      classId,
      orgId,
      accountId,
      query.cursor,
      query.limit,
    );
  }

  @Get(':classId/members')
  members(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.getMembers(classId, orgId, accountId);
  }

  @Get(':classId/status')
  unreadStatus(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.getUnreadStatus(classId, orgId, accountId);
  }

  @Get(':classId/active-meeting')
  activeMeeting(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.getActiveMeeting(classId, orgId, accountId);
  }

  @Post(':classId/messages')
  sendMessage(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser() user: any,
    @Body() dto: SendGroupyMessageDto,
  ) {
    return this.groupyService.sendMessage(classId, orgId, user, dto);
  }

  @Post(':classId/read')
  reportRead(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @Body() dto: ReportReadDto,
  ) {
    return this.groupyService.reportRead(
      classId,
      orgId,
      accountId,
      dto.lastMessageId,
    );
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  deleteMessage(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.deleteMessage(id, orgId, accountId);
  }

  @Put('messages/:id/reaction')
  setReaction(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @Body() dto: SetReactionDto,
  ) {
    return this.groupyService.setReaction(id, orgId, accountId, dto.reactionType);
  }

  @Delete('messages/:id/reaction')
  @HttpCode(HttpStatus.OK)
  removeReaction(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.removeReaction(id, orgId, accountId);
  }

  @Post(':classId/polls')
  createPoll(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser() user: any,
    @Body() dto: CreatePollDto,
  ) {
    return this.groupyService.createPoll(classId, orgId, user, dto);
  }

  @Post('polls/:pollId/vote')
  vote(
    @Param('pollId') pollId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
    @Body() dto: VotePollDto,
  ) {
    return this.groupyService.vote(pollId, orgId, accountId, dto.optionId);
  }

  @Patch('polls/:pollId/close')
  closePoll(
    @Param('pollId') pollId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.closePoll(pollId, orgId, accountId);
  }

  @Get('polls/:pollId/results')
  pollResults(
    @Param('pollId') pollId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.getPollResults(pollId, orgId, accountId);
  }

  @Get('polls/:pollId')
  pollDetail(
    @Param('pollId') pollId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') accountId: string,
  ) {
    return this.groupyService.getPollDetail(pollId, orgId, accountId);
  }

  @Post(':classId/start-meeting')
  startMeeting(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser() user: any,
    @Body() dto: StartMeetingDto,
  ) {
    return this.groupyService.startMeeting(
      classId,
      orgId,
      user,
      dto.invitedStudentIds,
    );
  }
}