import { forwardRef, Module } from '@nestjs/common';

import { GroupyController } from './groupy.controller';
import { GroupyService } from './groupy.service';
import { GiphyService } from './giphy.service';
import { GroupyCoreModule } from './core/groupy-core.module';
import { MeetingModule } from '../meeting/meeting.module';

@Module({
  imports: [GroupyCoreModule, forwardRef(() => MeetingModule)],
  controllers: [GroupyController],
  providers: [GroupyService, GiphyService],
  exports: [GroupyService, GroupyCoreModule],
})
export class GroupyModule {}
