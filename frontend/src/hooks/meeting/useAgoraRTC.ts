import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";

interface UseAgoraRTCProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

type AgoraRTCModule = typeof import("agora-rtc-sdk-ng")["default"];

type IScreenVideoTrack = ILocalVideoTrack & {
  on(
    event: "track-ended",
    listener: () => void | Promise<void>,
  ): IScreenVideoTrack;
};

const CAMERA_ENCODER_CONFIG = {
  width: 640,
  height: 480,
  frameRate: 24,
  bitrateMin: 400,
  bitrateMax: 800,
};

export const useAgoraRTC = ({
  appId,
  channel,
  token,
  uid,
}: UseAgoraRTCProps) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const agoraRTCRef = useRef<AgoraRTCModule | null>(null);
  const localAudioRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoRef = useRef<ILocalVideoTrack | null>(null);

  const [localAudio, setLocalAudio] = useState<ILocalAudioTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!appId || !channel || !token) return;

    let cancelled = false;
    let client: IAgoraRTCClient | null = null;

    const init = async () => {
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

      if (cancelled) return;

      agoraRTCRef.current = AgoraRTC;

      const meetingClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "h264",
      });

      client = meetingClient;
      clientRef.current = meetingClient;

      meetingClient.on("user-published", async (user, mediaType) => {
        try {
          await meetingClient.subscribe(user, mediaType);

          if (cancelled) return;

          if (mediaType === "video") {
            user.videoTrack?.play(`remote-${user.uid}`);
          }

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }

          setRemoteUsers((prev) => {
            const exists = prev.some((item) => item.uid === user.uid);

            return exists
              ? prev.map((item) => (item.uid === user.uid ? user : item))
              : [...prev, user];
          });
        } catch (error) {
          if (!cancelled) {
            console.error("Failed to subscribe to remote user:", error);
          }
        }
      });

      meetingClient.on("user-unpublished", (user) => {
        if (cancelled) return;

        setRemoteUsers((prev) =>
          prev.map((item) => (item.uid === user.uid ? user : item)),
        );
      });

      meetingClient.on("user-left", (user) => {
        if (cancelled) return;

        setRemoteUsers((prev) =>
          prev.filter((item) => item.uid !== user.uid),
        );
      });

      await meetingClient.join(appId, channel, token, uid);

      if (cancelled) {
        await meetingClient.leave();
        return;
      }

      const [micTrack, camTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          {
            encoderConfig: CAMERA_ENCODER_CONFIG,
            optimizationMode: "motion",
          },
        );

      if (cancelled) {
        micTrack.close();
        camTrack.close();
        await meetingClient.leave();
        return;
      }

      localAudioRef.current = micTrack;
      localVideoRef.current = camTrack;

      await meetingClient.publish([micTrack, camTrack]);

      if (cancelled) {
        micTrack.close();
        camTrack.close();
        await meetingClient.leave();
        return;
      }

      camTrack.play("local-video-pip");

      setLocalAudio(micTrack);
      setLocalVideo(camTrack);
      setJoined(true);
    };

    init().catch((error: unknown) => {
      if (!cancelled) {
        console.error("Failed to initialize Agora meeting:", error);
      }
    });

    return () => {
      cancelled = true;

      const audioTrack = localAudioRef.current;
      const videoTrack = localVideoRef.current;

      localAudioRef.current = null;
      localVideoRef.current = null;

      audioTrack?.close();
      videoTrack?.close();

      if (clientRef.current === client) {
        clientRef.current = null;
        agoraRTCRef.current = null;
      }

      if (client) {
        client.leave().catch((error: unknown) => {
          console.error("Failed to leave Agora meeting:", error);
        });
      }

      setJoined(false);
      setLocalAudio(null);
      setLocalVideo(null);
      setRemoteUsers([]);
    };
  }, [appId, channel, token, uid]);

  const toggleMic = async () => {
    const track = localAudioRef.current;

    if (!track) return;

    await track.setEnabled(!track.enabled);
  };

  const toggleCamera = async () => {
    const track = localVideoRef.current;

    if (!track) return;

    await track.setEnabled(!track.enabled);
  };

  const shareScreen = async () => {
    const client = clientRef.current;
    const AgoraRTC = agoraRTCRef.current;

    if (!client || !AgoraRTC) return;

    let screenTrack: IScreenVideoTrack | null = null;

    try {
      const createdTrack = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1" },
        "disable",
      );

      const createdScreenTrack = Array.isArray(createdTrack)
        ? createdTrack[0]
        : createdTrack;

      if (!createdScreenTrack) return;

      screenTrack = createdScreenTrack as IScreenVideoTrack;

      if (clientRef.current !== client) {
        screenTrack.close();
        return;
      }

      const cameraTrack = localVideoRef.current;

      if (cameraTrack) {
        await client.unpublish(cameraTrack);
        cameraTrack.stop();
      }

      if (clientRef.current !== client) {
        screenTrack.close();
        return;
      }

      await client.publish(screenTrack);

      if (clientRef.current !== client) {
        screenTrack.close();
        return;
      }

      const activeScreenTrack = screenTrack;

      activeScreenTrack.on("track-ended", async () => {
        const currentClient = clientRef.current;
        const currentAgoraRTC = agoraRTCRef.current;

        if (
          !currentClient ||
          currentClient !== client ||
          !currentAgoraRTC
        ) {
          return;
        }

        try {
          const cameraTrack = await currentAgoraRTC.createCameraVideoTrack({
            encoderConfig: CAMERA_ENCODER_CONFIG,
          });

          if (clientRef.current !== currentClient) {
            cameraTrack.close();
            return;
          }

          await currentClient.unpublish(activeScreenTrack);
          activeScreenTrack.close();

          await currentClient.publish(cameraTrack);

          if (clientRef.current !== currentClient) {
            cameraTrack.close();
            return;
          }

          localVideoRef.current = cameraTrack;
          setLocalVideo(cameraTrack);
        } catch (error) {
          console.error(
            "Failed to restore camera after screen sharing:",
            error,
          );
        }
      });

      localVideoRef.current = activeScreenTrack;
      setLocalVideo(activeScreenTrack);
    } catch (error) {
      screenTrack?.close();
      console.error("Failed to share screen:", error);
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