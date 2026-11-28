import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@/core/database/database.provider';
import { SocketRateLimiter } from '@/commons/utils/socket-rate-limiter.util';

const PRESENCE_LIMIT = { capacity: 6, refillMs: 5_000 };

interface Watcher {
  userId: string;
  name: string;
}

/**
 * Tracks admin observers who chose to be seen. It shares the meeting namespace
 * and only trusts sockets that MeetingGateway has already let into the room.
 */
@SkipThrottle({ default: true })
@WebSocketGateway({
  namespace: 'meeting',
  cors: { origin: '*', credentials: true },
})
export class MeetingPresenceGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // meetingId -> socketId -> watcher
  private readonly watchers = new Map<string, Map<string, Watcher>>();
  private readonly rateLimiter = new SocketRateLimiter();

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  handleDisconnect(client: Socket) {
    this.rateLimiter.clearSocket(client.id);
    const meetingId = this.meetingIdOf(client);
    if (meetingId) this.removeWatcher(meetingId, client.id);
  }

  @SubscribeMessage('watchers:sync')
  handleSync(@ConnectedSocket() client: Socket) {
    const meetingId = this.meetingIdOf(client);
    if (!meetingId || !client.rooms.has(meetingId)) return;
    client.emit('room:watchers', { watchers: this.list(meetingId) });
  }

  @SubscribeMessage('observer:set_visibility')
  async handleVisibility(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { visible: boolean },
  ) {
    const meetingId = this.meetingIdOf(client);
    if (!meetingId || !client.data?.observer) return;
    if (!client.rooms.has(meetingId)) return;
    if (typeof data?.visible !== 'boolean') return;
    if (
      !this.rateLimiter.checkLimit(client.id, 'presence', PRESENCE_LIMIT)
    ) {
      client.emit('rate_limited', { event: 'presence' });
      return;
    }

    if (!data.visible) {
      this.removeWatcher(meetingId, client.id);
      return;
    }

    // The token was verified by MeetingGateway when this socket connected.
    const token = client.handshake.auth?.token as string | undefined;
    const payload = token
      ? (this.jwtService.decode(token) as { sub?: string } | null)
      : null;
    if (!payload?.sub) return;

    const account = await this.db.account.findFirst({
      where: { id: payload.sub },
      include: { profile: true },
    });
    if (!client.connected) return;

    const room = this.watchers.get(meetingId) ?? new Map<string, Watcher>();
    room.set(client.id, {
      userId: payload.sub,
      name: account?.profile?.full_name ?? 'Admin',
    });
    this.watchers.set(meetingId, room);
    this.broadcast(meetingId);
  }

  private meetingIdOf(client: Socket): string | null {
    const value = client.handshake.query?.meetingId;
    return typeof value === 'string' && value ? value : null;
  }

  private removeWatcher(meetingId: string, socketId: string) {
    const room = this.watchers.get(meetingId);
    if (!room?.delete(socketId)) return;
    if (room.size === 0) this.watchers.delete(meetingId);
    this.broadcast(meetingId);
  }

  private list(meetingId: string): Watcher[] {
    const byUser = new Map<string, Watcher>();
    for (const watcher of this.watchers.get(meetingId)?.values() ?? []) {
      byUser.set(watcher.userId, watcher);
    }
    return Array.from(byUser.values());
  }

  private broadcast(meetingId: string) {
    this.server
      .to(meetingId)
      .emit('room:watchers', { watchers: this.list(meetingId) });
  }
}