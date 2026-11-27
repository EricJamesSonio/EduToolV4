import { useEffect, useState } from "react";
import type { IAgoraRTCClient, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface UseAgoraViewerProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  audioMuted: boolean;
}

/**
 * Subscribe-only Agora client for the admin live view. It never creates or
 * publishes local tracks, so the admin never turns on a mic or camera.
 */
export const useAgoraViewer = ({
  appId,
  channel,
  token,
  uid,
  audioMuted,
}: UseAgoraViewerProps) => {
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId || !channel || !token) return;

    let cancelled = false;
    let client: IAgoraRTCClient | null = null;

    const init = async () => {
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

      if (cancelled) return;

      const viewerClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "h264",
      });

      client = viewerClient;

      viewerClient.on("user-published", async (user, mediaType) => {
        try {
          await viewerClient.subscribe(user, mediaType);
        } catch (err) {
          if (!cancelled) {
            console.error("Failed to subscribe to remote user:", err);
          }
          return;
        }

        if (cancelled) return;

        setRemoteUsers((prev) => {
          const exists = prev.some((item) => item.uid === user.uid);

          return exists
            ? prev.map((item) => (item.uid === user.uid ? user : item))
            : [...prev, user];
        });
      });

      viewerClient.on("user-unpublished", (user) => {
        if (cancelled) return;

        setRemoteUsers((prev) =>
          prev.map((item) => (item.uid === user.uid ? user : item)),
        );
      });

      viewerClient.on("user-left", (user) => {
        if (cancelled) return;

        setRemoteUsers((prev) =>
          prev.filter((item) => item.uid !== user.uid),
        );
      });

      await viewerClient.join(appId, channel, token, uid);

      if (cancelled) {
        await viewerClient.leave();
        return;
      }

      setError(null);
      setJoined(true);
    };

    init().catch((err: unknown) => {
      if (cancelled) return;
      console.error("Failed to join meeting as viewer:", err);
      setError("Could not connect to the video room.");
    });

    return () => {
      cancelled = true;

      if (client) {
        client.leave().catch((err: unknown) => {
          console.error("Failed to leave Agora meeting:", err);
        });
      }

      setJoined(false);
      setRemoteUsers([]);
    };
  }, [appId, channel, token, uid]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (!user.audioTrack) return;

      if (audioMuted) {
        user.audioTrack.stop();
      } else {
        user.audioTrack.play();
      }
    });
  }, [remoteUsers, audioMuted]);

  return { joined, remoteUsers, error };
};