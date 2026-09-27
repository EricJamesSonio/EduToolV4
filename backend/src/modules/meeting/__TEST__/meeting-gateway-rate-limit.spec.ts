import { MeetingGateway } from '@/modules/meeting/meeting.gateway';

// Phase 2: burst from one client is throttled while normal-rate events
// (and other clients) still go through; invalid payloads are dropped.

function fakeClient(socketId: string) {
  const emit = jest.fn();
  const broadcastEmit = jest.fn();
  const client = {
    id: socketId,
    data: {
      meetingId: 'm-1',
      auth: {
        sub: `user-${socketId}`,
        org_id: 'org-1',
        role: 'student',
        email: 's@school.edu',
      },
      name: `Student ${socketId}`,
    },
    emit,
    broadcast: { to: jest.fn().mockReturnValue({ emit: broadcastEmit }) },
  };
  return { client, emit, broadcastEmit };
}

describe('MeetingGateway rate limiting + validation (Phase 2)', () => {
  let gateway: MeetingGateway;
  let db: {
    meetingChatMessage: { create: jest.Mock };
    account: { findFirst: jest.Mock };
  };
  let serverEmit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    db = {
      meetingChatMessage: {
        create: jest.fn().mockImplementation(async (args: unknown) => ({
          id: 'msg-1',
          created_at: new Date('2026-01-01T00:00:00Z'),
          ...((args as { data: unknown }).data as object),
        })),
      },
      account: { findFirst: jest.fn() },
    };
    gateway = new MeetingGateway(
      {} as never,
      {} as never,
      {} as never,
      db as never,
      {} as never,
    );
    serverEmit = jest.fn();
    (gateway as unknown as { server: unknown }).server = {
      to: jest.fn().mockReturnValue({ emit: serverEmit }),
    };
  });

  it('bursts chat: 2 pass, rest throttled with rate_limited feedback', async () => {
    const { client, emit, broadcastEmit } = fakeClient('sock-burst');

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await gateway.handleChatSend(client as never, { message: `hi ${i}` });
    }

    expect(db.meetingChatMessage.create).toHaveBeenCalledTimes(2);
    expect(broadcastEmit).toHaveBeenCalledTimes(2); // to others, never echo
    expect(emit).toHaveBeenCalledTimes(3);
    expect(emit).toHaveBeenCalledWith('rate_limited', { event: 'chat' });
  });

  it('normal-rate chat from another client is unaffected by the burst', async () => {
    const bursty = fakeClient('sock-burst');
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await gateway.handleChatSend(bursty.client as never, {
        message: `spam ${i}`,
      });
    }
    const { client, broadcastEmit } = fakeClient('sock-calm');
    await gateway.handleChatSend(client as never, { message: 'hello' });

    expect(db.meetingChatMessage.create).toHaveBeenCalledTimes(3);
    expect(broadcastEmit).toHaveBeenCalledTimes(1);
  });

  it('drops oversized chat without persisting', async () => {
    const { client, broadcastEmit } = fakeClient('sock-1');
    await gateway.handleChatSend(client as never, {
      message: 'x'.repeat(2001),
    });

    expect(db.meetingChatMessage.create).not.toHaveBeenCalled();
    expect(broadcastEmit).not.toHaveBeenCalled();
  });

  it('drops non-allowlisted reaction emoji', () => {
    const { client, broadcastEmit } = fakeClient('sock-1');
    gateway.handleReaction(client as never, { emoji: '💣' });

    expect(broadcastEmit).not.toHaveBeenCalled();
  });

  it('accepts allowlisted reaction and broadcasts to others', () => {
    const { client, broadcastEmit } = fakeClient('sock-1');
    gateway.handleReaction(client as never, { emoji: '👍' });

    expect(broadcastEmit).toHaveBeenCalledTimes(1);
    expect(broadcastEmit).toHaveBeenCalledWith(
      'reaction:received',
      expect.objectContaining({ emoji: '👍' }),
    );
  });

  it('drops out-of-range slide index without touching room state', () => {
    const { client, broadcastEmit } = fakeClient('sock-1');
    (gateway as unknown as { rooms: Map<string, unknown> }).rooms.set('m-1', {
      participants: new Map(),
      getParticipantList: () => [],
      currentSlide: 0,
    });

    gateway.handleSlideChange(client as never, { slide: -5 });
    gateway.handleSlideChange(client as never, { slide: Number.NaN });

    const room = (
      gateway as unknown as { rooms: Map<string, { currentSlide: number }> }
    ).rooms.get('m-1');
    expect(room?.currentSlide).toBe(0);
    expect(broadcastEmit).not.toHaveBeenCalled();
  });

  it('drops oversized signaling payload before relay', () => {
    const { client } = fakeClient('sock-1');
    gateway.handleOffer(client as never, {
      targetUserId: 'u-2',
      offer: { sdp: 'x'.repeat(9_000), type: 'offer' },
    });

    expect(serverEmit).not.toHaveBeenCalled();
  });

  it('hand raises broadcast to others (not echo) and throttle after burst', () => {
    const { client, broadcastEmit } = fakeClient('sock-1');
    (gateway as unknown as { rooms: Map<string, unknown> }).rooms.set('m-1', {
      participants: new Map([
        ['sock-1', { userId: 'user-sock-1', handRaised: false }],
      ]),
      getParticipantList: () => [{ userId: 'user-sock-1' }],
    });

    gateway.handleRaiseHand(client as never);
    expect(broadcastEmit).toHaveBeenCalledTimes(1);
    expect(broadcastEmit).toHaveBeenCalledWith(
      'hand:update',
      expect.objectContaining({ handRaised: true }),
    );
  });
});
