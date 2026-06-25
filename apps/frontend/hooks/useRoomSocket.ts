// hooks/useRoomSocket.ts
import { useEffect, useRef, useCallback } from "react";
import { socketManager } from "@/libs/socket/index";
import { PeerManager } from "@/libs/webrtc/PeerManager";
import { useAudio } from "@/context/AudioContext";

export interface RoomUser {
  id: string;
  name: string;
}

export interface UseRoomSocketOptions {
  roomId: string | undefined;
  currentUserId: string | undefined;
  currentUserName?: string;
  onUserJoined?: (data: { user: RoomUser; socketId: string }) => void;
  onUserLeft?: (data: { memberId: string; socketId: string }) => void;
}

export interface UseRoomSocketReturn {
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  hasJoined: boolean;
}

export function useRoomSocket({
  roomId,
  currentUserId,
  currentUserName,
  onUserJoined,
  onUserLeft,
}: UseRoomSocketOptions): UseRoomSocketReturn {
  // streamVersion is the KEY fix — it's a real state value that increments
  // whenever localStreamRef.current changes, allowing effects to fire
  const { startAudio, stopAudio, localStreamRef, streamVersion } = useAudio();

  const hasJoinedRef = useRef(false);
  const peerManagerRef = useRef<PeerManager | null>(null);

  // ── Join ────────────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async () => {
    if (!roomId || !currentUserId) return;

    peerManagerRef.current = new PeerManager(roomId);
    hasJoinedRef.current = true;

    await startAudio(currentUserId, roomId);

    socketManager.emit("join-room", {
      roomId,
      user: { id: currentUserId, name: currentUserName },
    });

    console.log(`[useRoomSocket] Joined room ${roomId}`);
  }, [roomId, currentUserId, currentUserName, startAudio]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    if (!roomId || !currentUserId) return;

    socketManager.emit("leave-room", { roomId, memberId: currentUserId });
    stopAudio(currentUserId);
    peerManagerRef.current?.closeAll();
    peerManagerRef.current = null;
    hasJoinedRef.current = false;

    console.log(`[useRoomSocket] Left room ${roomId}`);
  }, [roomId, currentUserId, stopAudio]);

  // ── user-joined / user-left ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const unsubJoined = socketManager.on("user-joined", async (payload: unknown) => {
      const { user, socketId } = payload as { user: RoomUser; socketId: string };
      console.log(`[useRoomSocket] user-joined: ${user.name} (${socketId})`);

      onUserJoined?.({ user, socketId });

      if (!peerManagerRef.current) return;
      const mySocketId = socketManager.getSocket()?.id;
      if (socketId === mySocketId) return;

      const pc = peerManagerRef.current.createConnection(
        socketId,
        localStreamRef.current
      );

      // Only send offer if we have a stream (user is unmuted)
      if (localStreamRef.current) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        socketManager.emit("offer", { to: socketId, offer });
      }
    });

    const unsubLeft = socketManager.on("user-left", (payload: unknown) => {
      const { memberId, socketId } = payload as {
        memberId: string;
        socketId: string;
      };
      console.log(`[useRoomSocket] user-left: ${memberId}`);
      onUserLeft?.({ memberId, socketId });
      peerManagerRef.current?.closeConnection(socketId);
    });

    return () => {
      unsubJoined();
      unsubLeft();
    };
  }, [roomId, onUserJoined, onUserLeft, localStreamRef]);

  // ── WebRTC signaling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const unsubOffer = socketManager.on("offer", async (payload: unknown) => {
      const { from, offer } = payload as {
        from: string;
        offer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received offer from ${from}`);
      await peerManagerRef.current?.handleOffer(from, offer, localStreamRef.current);
    });

    const unsubAnswer = socketManager.on("answer", async (payload: unknown) => {
      const { from, answer } = payload as {
        from: string;
        answer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received answer from ${from}`);
      await peerManagerRef.current?.handleAnswer(from, answer);
    });

    const unsubIce = socketManager.on("ice-candidate", async (payload: unknown) => {
      const { from, candidate } = payload as {
        from: string;
        candidate: RTCIceCandidateInit;
      };
      await peerManagerRef.current?.handleIceCandidate(from, candidate);
    });

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubIce();
    };
  }, [roomId, localStreamRef]);

  // ── THE FIX: Renegotiate when stream appears (streamVersion changes) ────────
  // streamVersion is real React state, so this effect correctly fires when
  // the user unmutes for the first time and localStreamRef.current is set.
  useEffect(() => {
    if (!hasJoinedRef.current) return;
    if (!localStreamRef.current) return;
    if (!peerManagerRef.current) return;
    if (peerManagerRef.current.getPeerCount() === 0) return;

    console.log(`[useRoomSocket] Stream available (v${streamVersion}), renegotiating with ${peerManagerRef.current.getPeerCount()} peers`);
    peerManagerRef.current.renegotiateAll(localStreamRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamVersion]); // ← streamVersion is the trigger, not the ref

  // ── Cleanup if unmounted without joining ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!hasJoinedRef.current) {
        if (currentUserId) stopAudio(currentUserId);
        peerManagerRef.current?.closeAll();
        peerManagerRef.current = null;
      }
    };
  }, [currentUserId, stopAudio]);

  return {
    joinRoom,
    leaveRoom,
    hasJoined: hasJoinedRef.current,
  };
}