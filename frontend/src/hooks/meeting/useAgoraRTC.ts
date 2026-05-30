import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";

interface UseAgoraRTCProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

export const useAgoraRTC = ({ appId, channel, token, uid }: UseAgoraRTCProps) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);

  const [localAudio, setLocalAudio] = useState<ILocalAudioTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!appId || !channel || !token) return;

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    clientRef.current = client;

    const init = async () => {
      await client.join(appId, channel, token, uid);

      const [micTrack, camTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          {
            encoderConfig: {
              width: 640,
              height: 480,
              frameRate: 24,
              bitrateMin: 400,
              bitrateMax: 800,
            },
            optimizationMode: "motion",
          }
        );

      await client.publish([micTrack, camTrack]);

      camTrack.play("local-video-pip");

      localAudioRef.current = micTrack;
      localVideoRef.current = camTrack;

      setLocalAudio(micTrack);
      setLocalVideo(camTrack);
      setJoined(true);
    };

    init().catch(console.error);

    // ✅ FIXED: always replace user with fresh object
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        user.videoTrack?.play(`remote-${user.uid}`);
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
      }

      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === user.uid);

        if (exists) {
          // 🔥 replace stale user (CRITICAL FIX)
          return prev.map((u) => (u.uid === user.uid ? user : u));
        }

        return [...prev, user];
      });
    });

    client.on("user-unpublished", (user) => {
      // Optional: keep user but remove track instead of full removal
      setRemoteUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? user : u))
      );
    });

    client.on("user-left", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      localAudioRef.current?.close();
      localVideoRef.current?.close();

      localAudioRef.current = null;
      localVideoRef.current = null;

      client.leave().catch(console.error);
      clientRef.current = null;

      setJoined(false);
      setLocalAudio(null);
      setLocalVideo(null);
      setRemoteUsers([]);
    };
  }, [appId, channel, token, uid]);

  const toggleMic = async () => {
    if (!localAudioRef.current) return;
    await localAudioRef.current.setEnabled(!localAudioRef.current.enabled);
  };

  const toggleCamera = async () => {
    if (!localVideoRef.current) return;
    await localVideoRef.current.setEnabled(!localVideoRef.current.enabled);
  };

  const shareScreen = async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1" },
        "disable"
      );

      // Unpublish camera
      if (localVideoRef.current) {
        await client.unpublish(localVideoRef.current);
        localVideoRef.current.stop();
      }

      await client.publish(screenTrack);

      screenTrack.on("track-ended", async () => {
        try {
          const cameraTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: {
              width: 640,
              height: 480,
              frameRate: 24,
              bitrateMin: 400,
              bitrateMax: 800,
            },
          });

          await client.unpublish(screenTrack);
          screenTrack.close();

          await client.publish(cameraTrack);

          localVideoRef.current = cameraTrack;
          setLocalVideo(cameraTrack);
        } catch (err) {
          console.error(err);
        }
      });

      localVideoRef.current = screenTrack as unknown as ICameraVideoTrack;
      setLocalVideo(screenTrack as unknown as ILocalVideoTrack);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    client: clientRef.current,
    joined,
    localAudio,
    localVideo,
    remoteUsers,
    toggleMic,
    toggleCamera,
    shareScreen,
  };
};