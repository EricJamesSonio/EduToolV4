import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MeetingRepository } from './meeting.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { GroupyGateway } from '../groupy/groupy.gateway';
import {
  SOCKET_CONNECT_LIMIT,
  SocketRateLimiter,
  type SocketRateLimitOptions,
} from '@/commons/utils/socket-rate-limiter.util';
import {
  isSignalingPayloadTooLarge,
  MeetingChatSendDto,
  MeetingPresentationStartDto,
  MeetingReactionDto,
  MeetingSlideChangeDto,
  WebrtcTargetDto,
} from './dto/meeting-socket.dto';

// Phase 2 (realtime safety): per-socket token buckets. Chat mirrors ~1/s with
// burst 2; reaction mirrors the client limiter (3 per 5s) server-side so raw
// socket emits can't bypass it; signaling allows ICE trickle bursts.
export const MEETING_SOCKET_LIMITS: Record<string, SocketRateLimitOptions> = {
  chat: { capacity: 2, refillMs: 2_000 },
  reaction: { capacity: 3, refillMs: 5_000 },
  hand: { capacity: 2, refillMs: 4_000 },
  slide: { capacity: 10, refillMs: 2_000 },
  presentation: { capacity: 4, refillMs: 5_000 },
  screen: { capacity: 4, refillMs: 5_000 },
  signaling: { capacity: 40, refillMs: 10_000 },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthPayload {
  sub: string;
  org_id: string | null;
  role: string;
  email: string;
}

interface RoomParticipant {
  socketId: string;
  userId: string;
  orgId: string;
  role: string;
  name: string;
  handRaised: boolean;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

// ── In-memory room state ───────────────────────────────────────────────────────

class RoomState {
  participants = new Map<string, RoomParticipant>(); // socketId → participant
  chatHistory: ChatMessage[] = [];
  currentSlide = 0; // lesson presentation sync
  isPresenting = false;
  presentationId?: string;
  // Students already announced in the class chat for this meeting session.
  // Guards against re-announcing on socket reconnect / page refresh.
  announcedJoins = new Set<string>();

  getParticipantList() {
    return Array.from(this.participants.values()).map((p) => ({
      userId: p.userId,
      name: p.name,
      role: p.role,
      handRaised: p.handRaised,
      joinedAt: p.joinedAt,
    }));
  }
}

// ── Gateway ───────────────────────────────────────────────────────────────────

@WebSocketGateway({
  namespace: 'meeting',
  cors: { origin: '*', credentials: true },
})
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MeetingGateway.name);

  // meetingId → RoomState
  private rooms = new Map<string, RoomState>();

  // Phase 2: shared token-bucket limiter (one instance per gateway).
  private readonly rateLimiter = new SocketRateLimiter();

  /**
   * Returns true when the socket is throttled (caller must drop the event).
   * Notifies the sender so burst clients get feedback instead of silence.
   */
  private hitRateLimit(client: Socket, bucket: string): boolean {
    const allowed = this.rateLimiter.checkLimit(
      client.id,
      bucket,
      MEETING_SOCKET_LIMITS[bucket],
    );
    if (!allowed) client.emit('rate_limited', { event: bucket });
    return !allowed;
  }

  /** class-validator check for inbound socket payloads (no ValidationPipe on WS). */
  private isValidDto<T extends object>(
    cls: new () => T,
    data: unknown,
  ): data is T {
    if (typeof data !== 'object' || data === null) return false;
    return (
      validateSync(plainToInstance(cls, data), { whitelist: true }).length ===
      0
    );
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly meetingRepo: MeetingRepository,
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => GroupyGateway))
    private readonly groupyGateway: GroupyGateway,
  ) {}

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

      const meetingId = client.handshake.query?.meetingId as string;
      if (!meetingId) return this.kick(client, 'Missing meetingId');

      // Phase 2: reconnect-storm guard (thundering-herd after server restart).
      if (
        !this.rateLimiter.checkLimit(
          payload.sub,
          'meeting:connect',
          SOCKET_CONNECT_LIMIT,
        )
      ) {
        return this.kick(client, 'Reconnecting too often — retry in a minute');
      }

      const meeting = await this.meetingRepo.findById(
        meetingId,
        payload.org_id,
      );
      if (!meeting) return this.kick(client, 'Meeting not found');
      if (meeting.status === 'ended')
        return this.kick(client, 'Meeting has ended');

      // Access check
      const isEducator =
        payload.role === 'educator' && meeting.educator_id === payload.sub;
      const isInvited =
        payload.role === 'student' &&
        (await this.meetingRepo.isStudentInvited(meetingId, payload.sub));

      if (!isEducator && !isInvited) {
        return this.kick(client, 'Not authorized for this meeting');
      }

      // Resolve display name
      const account = await this.db.account.findFirst({
        where: { id: payload.sub },
        include: { profile: true },
      });
      const name = account?.profile?.full_name ?? payload.email ?? 'Unknown';

      // Store auth on socket
      client.data.auth = payload;
      client.data.meetingId = meetingId;
      client.data.name = name;

      // Join socket.io room
      await client.join(meetingId);

      // Lifecycle: a created meeting becomes "active" once someone joins.
      if (meeting.status === 'scheduled') {
        await this.meetingRepo.updateStatus(meetingId, 'active');
      }

      // Update in-memory state
      if (!this.rooms.has(meetingId))
        this.rooms.set(meetingId, new RoomState());
      const room = this.rooms.get(meetingId)!;
      room.participants.set(client.id, {
        socketId: client.id,
        userId: payload.sub,
        orgId: payload.org_id,
        role: payload.role,
        name,
        handRaised: false,
        joinedAt: new Date(),
      });

      // Groupy (ephemeral) meetings: announce the student in the class chat so
      // everyone sees "[name] joined". Best-effort — a failure here must never
      // break the meeting join, so it is isolated from the shared try/catch.
      if (payload.role === 'student' && meeting.is_ephemeral) {
        if (!room.announcedJoins.has(payload.sub)) {
          room.announcedJoins.add(payload.sub);
          try {
            await this.groupyGateway.announceMemberJoined(
              meeting.class_id,
              payload.org_id,
              payload.sub,
              name,
            );
          } catch (err) {
            this.logger.error(
              `[${meetingId}] failed to announce join for ${name}: ${err}`,
            );
          }
        }
      }

      // Send room state to the joining client
      client.emit('room:state', {
        participants: room.getParticipantList(),
        chatHistory: room.chatHistory.slice(-50),
        currentSlide: room.currentSlide,
        isPresenting: room.isPresenting,
        presentationId: room.presentationId,
      });

      // Notify others (broadcast excludes the joiner, who already got room:state)
      client.broadcast.to(meetingId).emit('room:participant_joined', {
        userId: payload.sub,
        name,
        role: payload.role,
        participants: room.getParticipantList(),
      });

      this.logger.log(`[${meetingId}] ${name} (${payload.role}) connected`);
    } catch (err) {
      this.logger.error('handleConnection error', err);
      this.kick(client, 'Internal error');
    }
  }

  async handleDisconnect(client: Socket) {
    // Phase 2: drop dead-socket buckets so disconnect storms don't pin memory.
    this.rateLimiter.clearSocket(client.id);

    const meetingId = client.data?.meetingId;
    if (!meetingId) return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    const participant = room.participants.get(client.id);
    room.participants.delete(client.id);

    if (participant) {
      client.broadcast.to(meetingId).emit('room:participant_left', {
        userId: participant.userId,
        name: participant.name,
        participants: room.getParticipantList(),
      });
      this.logger.log(`[${meetingId}] ${participant.name} disconnected`);
    }

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(meetingId);

      // Ephemeral (Groupy) meetings are discarded once everyone leaves.
      const auth = client.data?.auth as AuthPayload | undefined;
      if (auth?.org_id) {
        const meeting = await this.meetingRepo.findById(meetingId, auth.org_id);
        if (meeting?.is_ephemeral) {
          await this.meetingRepo.hardDelete(meetingId);
        }
      }
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string },
  ) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth || !auth.org_id) return;

    // Phase 2: burst guard first (cheapest), then shared length validation.
    if (this.hitRateLimit(client, 'chat')) return;
    if (!this.isValidDto(MeetingChatSendDto, data)) return;

    const text = data.message.trim();
    if (!text) return;

    // Persist to DB
    const saved = await this.db.meetingChatMessage.create({
      data: {
        org_id: auth.org_id,
        meeting_id: meetingId,
        sender_id: auth.sub,
        sender_name: client.data.name,
        message: text,
      },
    });

    const msg: ChatMessage = {
      id: saved.id,
      senderId: auth.sub,
      senderName: client.data.name,
      message: text,
      createdAt: saved.created_at.toISOString(),
    };

    // Cache in room state
    const room = this.rooms.get(meetingId);
    if (room) room.chatHistory.push(msg);

    // Broadcast to everyone except the sender (sender uses its optimistic copy)
    client.broadcast.to(meetingId).emit('chat:message', msg);
  }

  // ── Raise hand ────────────────────────────────────────────────────────────

  @SubscribeMessage('hand:raise')
  handleRaiseHand(@ConnectedSocket() client: Socket) {
    this.setHandState(client, true);
  }

  @SubscribeMessage('hand:lower')
  handleLowerHand(@ConnectedSocket() client: Socket) {
    this.setHandState(client, false);
  }

  private setHandState(client: Socket, raised: boolean) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth) return;

    // Phase 2: hand toggles fan out the full participant list — throttle them.
    if (this.hitRateLimit(client, 'hand')) return;

    const room = this.rooms.get(meetingId);
    const participant = room?.participants.get(client.id);
    if (!participant) return;

    participant.handRaised = raised;

    client.broadcast.to(meetingId).emit('hand:update', {
      userId: auth.sub,
      name: client.data.name,
      handRaised: raised,
      participants: room!.getParticipantList(),
    });
  }

  // ── Reactions ─────────────────────────────────────────────────────────────

  @SubscribeMessage('reaction:send')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { emoji: string },
  ) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth) return;

    // Phase 2: server-enforced mirror of the client 3-per-5s limiter +
    // allowlist validation via the shared schema (no inline list).
    if (this.hitRateLimit(client, 'reaction')) return;
    if (!this.isValidDto(MeetingReactionDto, data)) return;
    const emoji = data.emoji;

    client.broadcast.to(meetingId).emit('reaction:received', {
      userId: auth.sub,
      name: client.data.name,
      emoji,
    });
  }

  // ── WebRTC signaling ──────────────────────────────────────────────────────
  // Peer-to-peer signaling relay. Each client sends offer/answer/ICE
  // addressed to a specific targetUserId. The gateway looks up that user's
  // current socket and forwards the payload directly.

  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { targetUserId: string; offer: RTCSessionDescriptionInit },
  ) {
    // Phase 2: throttle trickle bursts + cap SDP bytes before relaying verbatim.
    if (this.hitRateLimit(client, 'signaling')) return;
    if (!this.isValidDto(WebrtcTargetDto, data)) return;
    if (isSignalingPayloadTooLarge(data.offer)) return;
    this.relayToUser(client, data.targetUserId, 'webrtc:offer', {
      fromUserId: client.data.auth?.sub,
      offer: data.offer,
    });
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { targetUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    if (this.hitRateLimit(client, 'signaling')) return;
    if (!this.isValidDto(WebrtcTargetDto, data)) return;
    if (isSignalingPayloadTooLarge(data.answer)) return;
    this.relayToUser(client, data.targetUserId, 'webrtc:answer', {
      fromUserId: client.data.auth?.sub,
      answer: data.answer,
    });
  }

  @SubscribeMessage('webrtc:ice')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { targetUserId: string; candidate: RTCIceCandidateInit },
  ) {
    if (this.hitRateLimit(client, 'signaling')) return;
    if (!this.isValidDto(WebrtcTargetDto, data)) return;
    if (isSignalingPayloadTooLarge(data.candidate)) return;
    this.relayToUser(client, data.targetUserId, 'webrtc:ice', {
      fromUserId: client.data.auth?.sub,
      candidate: data.candidate,
    });
  }

  // ── Lesson presentation sync ──────────────────────────────────────────────
  // Only the educator can control the slide. Students receive sync events.

  @SubscribeMessage('lesson:slide_change')
  handleSlideChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { slide: number },
  ) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth) return;
    if (auth.role !== 'educator') return; // students cannot control slides

    // Phase 2: shared int/range validation (rejects NaN, negative, huge).
    if (this.hitRateLimit(client, 'slide')) return;
    if (!this.isValidDto(MeetingSlideChangeDto, data)) return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    room.currentSlide = data.slide;
    client.broadcast.to(meetingId).emit('lesson:slide_sync', {
      slide: data.slide,
      controlledBy: auth.sub,
    });
  }

  @SubscribeMessage('lesson:presentation_start')
  handlePresentationStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { presentationId?: string },
  ) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || auth?.role !== 'educator') return;

    // Phase 2: throttle presentation toggles + bound optional presentationId.
    if (this.hitRateLimit(client, 'presentation')) return;
    if (
      data !== undefined &&
      !this.isValidDto(MeetingPresentationStartDto, data)
    )
      return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    room.isPresenting = true;
    room.presentationId = data?.presentationId ?? room.presentationId;
    client.broadcast.to(meetingId).emit('lesson:presentation_started', {
      educatorId: auth.sub,
      currentSlide: room.currentSlide,
      presentationId: room.presentationId,
    });
  }

  @SubscribeMessage('lesson:presentation_stop')
  handlePresentationStop(@ConnectedSocket() client: Socket) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || auth?.role !== 'educator') return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    room.isPresenting = false;
    room.presentationId = undefined;
    client.broadcast.to(meetingId).emit('lesson:presentation_stopped', {
      educatorId: auth.sub,
    });
  }

  // ── Screen share signaling ────────────────────────────────────────────────
  // Screen share is handled via WebRTC (same offer/answer/ICE flow above).
  // These events just broadcast awareness that someone started/stopped sharing.

  @SubscribeMessage('screen:share_started')
  handleScreenShareStart(@ConnectedSocket() client: Socket) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth) return;

    // Phase 2: throttle share-toggle awareness broadcasts.
    if (this.hitRateLimit(client, 'screen')) return;

    client.broadcast.to(meetingId).emit('screen:sharing', {
      userId: auth.sub,
      name: client.data.name,
      sharing: true,
    });
  }

  @SubscribeMessage('screen:share_stopped')
  handleScreenShareStop(@ConnectedSocket() client: Socket) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || !auth) return;

    if (this.hitRateLimit(client, 'screen')) return;

    client.broadcast.to(meetingId).emit('screen:sharing', {
      userId: auth.sub,
      name: client.data.name,
      sharing: false,
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

  private relayToUser(
    sender: Socket,
    targetUserId: string,
    event: string,
    payload: object,
  ) {
    const meetingId = sender.data?.meetingId;
    if (!meetingId) return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    // Find the target's socketId
    for (const [socketId, p] of room.participants.entries()) {
      if (p.userId === targetUserId) {
        this.server.to(socketId).emit(event, payload);
        return;
      }
    }
  }
}
