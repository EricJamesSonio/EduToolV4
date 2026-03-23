// src/core/events/event.module.ts
import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from './event.service';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true, // allows pattern events
      delimiter: '.',
    }),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}