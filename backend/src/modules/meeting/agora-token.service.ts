import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MeetingRepository } from './meeting.repository';

@Injectable()
export class AgoraTokenService {
  private readonly appId: string;
  private readonly appCert: string;

  constructor(
    private readonly config: ConfigService,
    private readonly meetingRepo: MeetingRepository,
  ) {
    this.appId = this.config.get<string>('AGORA_APP_ID') ?? '';
    this.appCert = this.config.get<string>('AGORA_APP_CERT') ?? '';
  }

  // Deterministic uid from userId string (mirrors Python _user_id_to_uid)
  private userIdToUid(userId: string): number {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return parseInt(hash.slice(0, 8), 16) % (2 ** 31);
  }

  async getToken(meetingId: string, orgId: string, userId: string, userRole: string) {
    const meeting = await this.meetingRepo.findById(meetingId, orgId);
    if (!meeting) throw new NotFoundException('Meeting not found.');
    if (meeting.status === 'ended') {
      throw new BadRequestException('Meeting has already ended.');
    }

    // Educators always get in; students must be invited or enrolled
    if (userRole === 'student') {
      const isInvited = await this.meetingRepo.isStudentInvited(meetingId, userId);
      if (!isInvited) {
        throw new ForbiddenException('You are not invited to this meeting.');
      }
    } else if (userRole === 'educator' && meeting.educator_id !== userId) {
      throw new ForbiddenException('You do not own this meeting.');
    }

    const uid = this.userIdToUid(userId);
    const channel = `meeting_${meetingId}`;

    // If Agora credentials are not configured, return a dev mock token
    if (!this.appId || !this.appCert) {
      return {
        token: 'dev_mock_token',
        channel,
        appId: this.appId || 'dev_app_id',
        uid,
        warning: 'Agora keys not configured — using mock token for dev',
      };
    }

    const token = this.buildRtcToken(channel, uid);
    return { token, channel, appId: this.appId, uid };
  }

  // ── Agora RTC token builder (AccessToken2 spec) ───────────────────────────
  // Implements the Agora token algorithm directly without an SDK dependency.
  // Reference: https://docs.agora.io/en/video-calling/get-started/authentication-workflow

  private buildRtcToken(channelName: string, uid: number): string {
    const expireTs = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Privilege values
    const privileges: Record<number, number> = {
      1: expireTs, // joinChannel
      2: expireTs, // publishAudioStream
      3: expireTs, // publishVideoStream
      4: expireTs, // publishDataStream
    };

    const version = '007';
    const appIdBuf = Buffer.from(this.appId, 'utf8');
    const ts = Math.floor(Date.now() / 1000);
    const salt = Math.floor(Math.random() * 0xffffffff);

    // Build message
    const msgBuf = this.packMessage(ts, salt, expireTs, uid, channelName, privileges);

    // HMAC-SHA256 signature
    const sig = crypto
      .createHmac('sha256', Buffer.from(this.appCert, 'utf8'))
      .update(Buffer.concat([appIdBuf, msgBuf]))
      .digest();

    // Pack final token
    const tokenBuf = this.packToken(sig, msgBuf);
    return `${version}${this.appId}${tokenBuf.toString('base64')}`;
  }

  private packMessage(
    ts: number,
    salt: number,
    expireTs: number,
    uid: number,
    channelName: string,
    privileges: Record<number, number>,
  ): Buffer {
    const parts: Buffer[] = [];
    parts.push(this.packUint32(ts));
    parts.push(this.packUint32(salt));
    parts.push(this.packUint32(expireTs));
    parts.push(this.packUint32(uid));
    parts.push(this.packString(channelName));

    // Pack privileges map
    const privKeys = Object.keys(privileges).map(Number).sort();
    parts.push(this.packUint16(privKeys.length));
    for (const k of privKeys) {
      parts.push(this.packUint16(k));
      parts.push(this.packUint32(privileges[k]));
    }

    return Buffer.concat(parts);
  }

  private packToken(sig: Buffer, msg: Buffer): Buffer {
    const parts: Buffer[] = [];
    parts.push(this.packBytes(sig));
    parts.push(this.packBytes(msg));
    return Buffer.concat(parts);
  }

  private packUint16(v: number): Buffer {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(v, 0);
    return b;
  }

  private packUint32(v: number): Buffer {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(v >>> 0, 0);
    return b;
  }

  private packString(s: string): Buffer {
    const strBuf = Buffer.from(s, 'utf8');
    return Buffer.concat([this.packUint16(strBuf.length), strBuf]);
  }

  private packBytes(b: Buffer): Buffer {
    return Buffer.concat([this.packUint16(b.length), b]);
  }
}