import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/core/database/database.provider';
import { GroupyRepository } from './groupy.repository';

interface AuthPayload {
  sub: string;
  org_id: string | null;
  role: string;
  email: string;
}

@WebSocketGateway({
  namespace: 'groupy',
  cors: { origin: '*', credentials: true },
})
export class GroupyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GroupyGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly groupyRepo: GroupyRepository,
    private readonly db: DatabaseService,
  ) {}

  private roomName(classId: string) {
    return `class:${classId}`;
  }

  // ── Connection ────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (!token) return this.kick(client, 'Missing token');

      const payload = this.verifyToken(token);
      if (!payload) return this.kick(client, 'Invalid token');
      if (!payload.org_id) return this.kick(client, 'Missing org');

      const classId = client.handshake.query?.classId as string;
      if (!classId) return this.kick(client, 'Missing classId');

      // Membership check — reject non-members before they join the room.
      const isMember = await this.groupyRepo.isClassMember(
        payload.sub,
        classId,
        payload.org_id,
      );
      if (!isMember) return this.kick(client, 'Not a member of this class');

      // Resolve display name
      const account = await this.db.account.findFirst({
        where: { id: payload.sub },
        include: { profile: true },
      });
      const name = account?.profile?.full_name ?? payload.email ?? 'Unknown';

      // Store auth on socket
      client.data.auth = payload;
      client.data.classId = classId;
      client.data.name = name;

      // Join socket.io room
      await client.join(this.roomName(classId));

      this.logger.log(
        `[groupy:${classId}] ${name} (${payload.role}) connected`,
      );
    } catch (err) {
      this.logger.error('handleConnection error', err);
      this.kick(client, 'Internal error');
    }
  }

  async handleDisconnect(client: Socket) {
    const classId = client.data?.classId;
    if (!classId) return;
    await client.leave(this.roomName(classId));
  }

  // ── Meeting join announcements (called by MeetingGateway) ─────────────────

  // Persist a "[name] joined" system message on the Groupy stream and push it
  // to anyone currently watching the class chat. Used when a student joins a
  // Groupy (ephemeral) meeting so everyone in the chat sees who is coming in.
  async announceMemberJoined(
    classId: string,
    orgId: string,
    accountId: string,
    name: string,
  ) {
    const message = await this.groupyRepo.createMessage({
      orgId,
      classId,
      senderAccountId: accountId,
      senderRole: 'student',
      senderName: name,
      type: 'system',
      body: `${name} joined`,
    });
    this.emitMessageNew(message);
    return message;
  }

  // ── Broadcast helpers (called by GroupyService) ───────────────────────────

  emitMessageNew(message: { class_id: string } & Record<string, unknown>) {
    this.server
      .to(this.roomName(message.class_id))
      .emit('groupy:message:new', message);
  }

  emitMessageDeleted(message: { id: string; class_id: string }) {
    this.server
      .to(this.roomName(message.class_id))
      .emit('groupy:message:deleted', { id: message.id });
  }

  emitReactionUpdated(args: {
    classId: string;
    messageId: string;
    accountId: string;
    reactionType: string;
  }) {
    this.server.to(this.roomName(args.classId)).emit('groupy:reaction:updated', {
      messageId: args.messageId,
      accountId: args.accountId,
      reactionType: args.reactionType,
    });
  }

  emitReactionRemoved(args: {
    classId: string;
    messageId: string;
    accountId: string;
  }) {
    this.server.to(this.roomName(args.classId)).emit('groupy:reaction:removed', {
      messageId: args.messageId,
      accountId: args.accountId,
    });
  }

  emitPollVoteUpdated(args: {
    classId: string;
    pollId: string;
    resultsSummary: unknown;
  }) {
    this.server.to(this.roomName(args.classId)).emit('groupy:poll:vote-updated', {
      pollId: args.pollId,
      resultsSummary: args.resultsSummary,
    });
  }

  emitPollClosed(args: { classId: string; pollId: string }) {
    this.server
      .to(this.roomName(args.classId))
      .emit('groupy:poll:closed', { pollId: args.pollId });
  }

  emitReadUpdated(args: {
    classId: string;
    accountId: string;
    lastReadMessageId: string;
  }) {
    this.server.to(this.roomName(args.classId)).emit('groupy:read:updated', {
      classId: args.classId,
      accountId: args.accountId,
      lastReadMessageId: args.lastReadMessageId,
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private verifyToken(token: string): AuthPayload | null {
    try {
      return this.jwtService.verify<AuthPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      return null;
    }
  }

  private kick(client: Socket, reason: string) {
    client.emit('error', { message: reason });
    client.disconnect(true);
  }
}