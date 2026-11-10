import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface NotificationStreamEvent {
  type: string;
  payload: object;
}

interface Envelope {
  accountId: string;
  event: NotificationStreamEvent;
}

@Injectable()
export class NotificationEventsService {
  private readonly bus = new Subject<Envelope>();

  emit(accountId: string, event: NotificationStreamEvent): void {
    this.bus.next({ accountId, event });
  }

  streamFor(accountId: string): Observable<NotificationStreamEvent> {
    return this.bus.pipe(
      filter((envelope) => envelope.accountId === accountId),
      map((envelope) => envelope.event),
    );
  }
}