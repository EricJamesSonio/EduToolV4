// src/core/events/event.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventService {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(event: string, payload: any) {
    this.eventEmitter.emit(event, payload);
  }

  emitAsync(event: string, payload: any) {
    return this.eventEmitter.emitAsync(event, payload);
  }
}