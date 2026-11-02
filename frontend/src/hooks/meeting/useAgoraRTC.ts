import { useCallback, useEffect, useRef, useState } from "react";
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

/** Agora `close()` throws when a track was already closed. */
function closeTrack(track: ILocalAudioTrack | ILocalVideoTrack | null): void {
  if (!track) return;
  try {
    track.close();
  } catch {
    /* already closed */
  }
}

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
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

  const [localAudio, setLocalAudio] = useState<ILocalAudioTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

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
      cameraTrackRef.current = camTrack;

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
      const cameraTrack = cameraTrackRef.current;
      const screenTrack = screenTrackRef.current;

      localAudioRef.current = null;
      localVideoRef.current = null;
      cameraTrackRef.current = null;
      screenTrackRef.current = null;

      closeTrack(audioTrack);
      // `videoTrack` is the screen track while sharing; close both explicitly
      // so the camera is not leaked when sharing ends at unmount.
      if (videoTrack !== screenTrack) closeTrack(videoTrack);
      closeTrack(cameraTrack);
      closeTrack(screenTrack);

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
      setIsScreenSharing(false);
    };
  }, [appId, channel, token, uid]);

  const toggleMic = async () => {
    const track = localAudioRef.current;

    if (!track) return;

    await track.setEnabled(!track.enabled);
  };

  const toggleCamera = async () => {
    // While screen sharing, `localVideoRef` points at the screen track; the
    // camera toggle must always target the camera track.
    const track = cameraTrackRef.current;

    if (!track) return;

    await track.setEnabled(!track.enabled);
  };

  const restoreCamera = useCallback(async (client: IAgoraRTCClient) => {
    const cameraTrack = cameraTrackRef.current;

    if (!cameraTrack || clientRef.current !== client) return;

    try {
      await client.publish(cameraTrack);

      if (clientRef.current !== client) return;

      localVideoRef.current = cameraTrack;
      setLocalVideo(cameraTrack);

      try {
        cameraTrack.play("local-video-pip");
      } catch {
        /* pip element may already be unmounted */
      }
    } catch (error) {
      console.error("Failed to restore camera after screen sharing:", error);
      localVideoRef.current = null;
      setLocalVideo(null);
    }
  }, []);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    const client = clientRef.current;
    const screenTrack = screenTrackRef.current;

    if (!screenTrack) return;

    screenTrackRef.current = null;
    setIsScreenSharing(false);

    if (localVideoRef.current === screenTrack) {
      localVideoRef.current = null;
      setLocalVideo(null);
    }

    if (client) {
      try {
        await client.unpublish(screenTrack);
      } catch (error) {
        console.error("Failed to unpublish screen track:", error);
      }
    }

    closeTrack(screenTrack);

    if (client && clientRef.current === client) {
      await restoreCamera(client);
    }
  }, [restoreCamera]);

  const shareScreen = async () => {
    const client = clientRef.current;
    const AgoraRTC = agoraRTCRef.current;

    if (!client || !AgoraRTC || screenTrackRef.current) return;

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
        closeTrack(screenTrack);
        return;
      }

      // Keep the camera track alive (on the device) so stopping the share can
      // republish it instead of leaking it and re-acquiring the camera.
      const cameraTrack = cameraTrackRef.current;

      if (cameraTrack) {
        await client.unpublish(cameraTrack);
        cameraTrack.stop();
      }

      if (clientRef.current !== client) {
        closeTrack(screenTrack);
        return;
      }

      await client.publish(screenTrack);

      if (clientRef.current !== client) {
        closeTrack(screenTrack);
        return;
      }

      screenTrackRef.current = screenTrack;
      localVideoRef.current = screenTrack;
      setLocalVideo(screenTrack);
      setIsScreenSharing(true);

      screenTrack.on("track-ended", () => {
        void stopScreenShare();
      });
    } catch (error) {
      closeTrack(screenTrack);
      screenTrackRef.current = null;
      setIsScreenSharing(false);
      console.error("Failed to share screen:", error);

      // Camera was unpublished before the failure: put it back.
      if (clientRef.current === client) {
        await restoreCamera(client);
      }
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
    stopScreenShare,
    isScreenSharing,
  };
};