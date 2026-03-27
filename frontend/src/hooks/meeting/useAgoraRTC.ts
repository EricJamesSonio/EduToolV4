import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteUser,
} from "agora-rtc-sdk-ng";

interface UseAgoraRTCProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

export const useAgoraRTC = ({
  appId,
  channel,
  token,
  uid,
}: UseAgoraRTCProps) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  const [localAudio, setLocalAudio] = useState<ILocalAudioTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);

  // ==============================
  // Init + Join
  // ==============================
  useEffect(() => {
    if (!appId || !channel || !token) return;

    const client = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    clientRef.current = client;

    const init = async () => {
      await client.join(appId, channel, token, uid);

      const [micTrack, camTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();

      await client.publish([micTrack, camTrack]);

      setLocalAudio(micTrack);
      setLocalVideo(camTrack);
      setJoined(true);
    };

    init();

    // ==============================
    // Remote users
    // ==============================
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        user.videoTrack?.play(`remote-${user.uid}`);
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
      }

      setRemoteUsers((prev) => [...prev, user]);
    });

    client.on("user-unpublished", (user) => {
      setRemoteUsers((prev) =>
        prev.filter((u) => u.uid !== user.uid)
      );
    });

    client.on("user-left", (user) => {
      setRemoteUsers((prev) =>
        prev.filter((u) => u.uid !== user.uid)
      );
    });

    return () => {
      const cleanup = async () => {
        localAudio?.close();
        localVideo?.close();
        await client.leave();
      };

      cleanup();
    };
  }, [appId, channel, token, uid]);

  // ==============================
  // Controls
  // ==============================

  const toggleMic = async () => {
    if (!localAudio) return;
    await localAudio.setEnabled(!localAudio.enabled);
  };

  const toggleCamera = async () => {
    if (!localVideo) return;
    await localVideo.setEnabled(!localVideo.enabled);
  };

  return {
    client: clientRef.current,
    joined,

    localAudio,
    localVideo,
    remoteUsers,

    toggleMic,
    toggleCamera,
  };
};