# Realtime Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Transport

Library/protocol: Socket.IO 4.8.3 over NestJS WebSocketGateway (see backend/package.json socket.io, @nestjs/websockets, groupy.gateway.ts namespace 'groupy'), plus Agora RTC 4.24.3 for meetings (agora-rtc-sdk-ng, agora-token).
Gateway file(s): backend/src/modules/groupy/groupy.gateway.ts (namespace groupy, rooms class:{classId}), backend/src/modules/meeting/* gateway(s) if present, presentation gateway.
Client-side hook(s): frontend/src/hooks/groupy/useGroupySocket.ts, useGroupyMessages.ts, useGroupyUnread.ts, useGroupyMembers.ts, useGroupyPollDetail.ts, useGroupyActiveMeeting.ts, useGroupyStickers.ts, groupyCache.ts; meeting: hooks/meeting/useMeetingSocket.ts, useMeetingPresentation.ts, useAgoraRTC.ts, MeetingContext.tsx.
