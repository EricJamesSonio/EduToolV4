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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MeetingRepository } from './meeting.repository';
import { DatabaseService } from '@/core/database/database.provider';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthPayload {
  sub: string;
  orgId: string;
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
  currentSlide = 0;    // lesson presentation sync
  isPresenting = false;

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
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MeetingGateway.name);

  // meetingId → RoomState
  private rooms = new Map<string, RoomState>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly meetingRepo: MeetingRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── Connection ────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) return this.kick(client, 'Missing token');

      const payload = this.verifyToken(token);
      if (!payload) return this.kick(client, 'Invalid token');

      const meetingId = client.handshake.query?.meetingId as string;
      if (!meetingId) return this.kick(client, 'Missing meetingId');

      const meeting = await this.meetingRepo.findById(meetingId, payload.orgId);
      if (!meeting) return this.kick(client, 'Meeting not found');
      if (meeting.status === 'ended') return this.kick(client, 'Meeting has ended');

      // Access check
      const isEducator = payload.role === 'educator' && meeting.educator_id === payload.sub;
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

      // Update in-memory state
      if (!this.rooms.has(meetingId)) this.rooms.set(meetingId, new RoomState());
      const room = this.rooms.get(meetingId)!;
      room.participants.set(client.id, {
        socketId: client.id,
        userId: payload.sub,
        orgId: payload.orgId,
        role: payload.role,
        name,
        handRaised: false,
        joinedAt: new Date(),
      });

      // Send room state to the joining client
      client.emit('room:state', {
        participants: room.getParticipantList(),
        chatHistory: room.chatHistory.slice(-50),
        currentSlide: room.currentSlide,
        isPresenting: room.isPresenting,
      });

      // Notify others
      this.server.to(meetingId).emit('room:participant_joined', {
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
    const meetingId = client.data?.meetingId;
    if (!meetingId) return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    const participant = room.participants.get(client.id);
    room.participants.delete(client.id);

    if (participant) {
      this.server.to(meetingId).emit('room:participant_left', {
        userId: participant.userId,
        name: participant.name,
        participants: room.getParticipantList(),
      });
      this.logger.log(`[${meetingId}] ${participant.name} disconnected`);
    }

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(meetingId);
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
    if (!meetingId || !auth) return;

    const text = (data?.message ?? '').trim();
    if (!text) return;

    // Persist to DB
    const saved = await this.db.meetingChatMessage.create({
      data: {
        org_id: auth.orgId,
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

    // Broadcast to all in room
    this.server.to(meetingId).emit('chat:message', msg);
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

    const room = this.rooms.get(meetingId);
    const participant = room?.participants.get(client.id);
    if (!participant) return;

    participant.handRaised = raised;

    this.server.to(meetingId).emit('hand:update', {
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

    const allowed = ['👍', '👏', '❤️', '😂', '😮', '🎉'];
    const emoji = data?.emoji;
    if (!allowed.includes(emoji)) return;

    this.server.to(meetingId).emit('reaction:received', {
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
    @MessageBody() data: { targetUserId: string; offer: RTCSessionDescriptionInit },
  ) {
    this.relayToUser(client, data.targetUserId, 'webrtc:offer', {
      fromUserId: client.data.auth?.sub,
      offer: data.offer,
    });
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    this.relayToUser(client, data.targetUserId, 'webrtc:answer', {
      fromUserId: client.data.auth?.sub,
      answer: data.answer,
    });
  }

  @SubscribeMessage('webrtc:ice')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; candidate: RTCIceCandidateInit },
  ) {
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

    const room = this.rooms.get(meetingId);
    if (!room) return;

    room.currentSlide = data.slide;
    this.server.to(meetingId).emit('lesson:slide_sync', {
      slide: data.slide,
      controlledBy: auth.sub,
    });
  }

  @SubscribeMessage('lesson:presentation_start')
  handlePresentationStart(@ConnectedSocket() client: Socket) {
    const meetingId = client.data?.meetingId;
    const auth: AuthPayload = client.data?.auth;
    if (!meetingId || auth?.role !== 'educator') return;

    const room = this.rooms.get(meetingId);
    if (!room) return;

    room.isPresenting = true;
    this.server.to(meetingId).emit('lesson:presentation_started', {
      educatorId: auth.sub,
      currentSlide: room.currentSlide,
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
    this.server.to(meetingId).emit('lesson:presentation_stopped', {
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

    this.server.to(meetingId).emit('screen:sharing', {
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

    this.server.to(meetingId).emit('screen:sharing', {
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