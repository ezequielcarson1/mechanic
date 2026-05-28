import { useCallback, useEffect, useRef, useState } from 'react';
import Daily, {
  DailyCall, DailyEventObjectParticipant, DailyParticipant,
} from '@daily-co/react-native-daily-js';

export type CallState = 'idle' | 'joining' | 'joined' | 'error';

export interface UseDailyCall {
  callState: CallState;
  localParticipant: DailyParticipant | null;
  remoteParticipant: DailyParticipant | null;
  isAudioMuted: boolean;
  isCameraOff: boolean;
  errorMessage: string | null;
  join: (roomUrl: string, token: string) => Promise<void>;
  leave: () => Promise<void>;
  toggleAudio: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
}

export function useDailyCall(): UseDailyCall {
  const callRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<DailyParticipant | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const syncParticipants = useCallback((call: DailyCall) => {
    const participants = call.participants();
    setLocalParticipant(participants.local ?? null);
    const remote = Object.values(participants).find((p) => !p.local) ?? null;
    setRemoteParticipant(remote);
    setIsAudioMuted(!call.localAudio());
    setIsCameraOff(!call.localVideo());
  }, []);

  const join = useCallback(async (roomUrl: string, token: string) => {
    if (callRef.current) return;
    const call = Daily.createCallObject();
    callRef.current = call;
    setCallState('joining');

    const onUpdate = (_e?: DailyEventObjectParticipant) => syncParticipants(call);
    call.on('joined-meeting', () => { setCallState('joined'); syncParticipants(call); });
    call.on('participant-joined', onUpdate);
    call.on('participant-updated', onUpdate);
    call.on('participant-left', () => setRemoteParticipant(null));
    call.on('error', (e: any) => { setErrorMessage(e?.errorMsg ?? 'Call error'); setCallState('error'); });

    try {
      await call.join({ url: roomUrl, token });
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Failed to join call');
      setCallState('error');
    }
  }, [syncParticipants]);

  const leave = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    await call.leave();
    await call.destroy();
    callRef.current = null;
    setCallState('idle');
  }, []);

  const toggleAudio = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = call.localAudio();
    call.setLocalAudio(!next);
    setIsAudioMuted(next);
  }, []);

  const toggleCamera = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = call.localVideo();
    call.setLocalVideo(!next);
    setIsCameraOff(next);
  }, []);

  const switchCamera = useCallback(() => {
    callRef.current?.cycleCamera();
  }, []);

  useEffect(() => {
    return () => {
      const call = callRef.current;
      if (call) { call.leave().finally(() => call.destroy()); callRef.current = null; }
    };
  }, []);

  return {
    callState, localParticipant, remoteParticipant, isAudioMuted, isCameraOff, errorMessage,
    join, leave, toggleAudio, toggleCamera, switchCamera,
  };
}
