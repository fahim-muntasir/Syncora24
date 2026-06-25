// libs/webrtc/PeerManager.ts
import { socketManager } from "@/libs/socket/index";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export type PeerEventType = "track" | "connected" | "disconnected" | "failed";
export type PeerEventHandler = (socketId: string, event?: RTCTrackEvent) => void;

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private eventHandlers: Map<PeerEventType, Set<PeerEventHandler>> = new Map();
  // Buffer ICE candidates that arrive before remote description is set
  private iceCandidateBuffer: Map<string, RTCIceCandidateInit[]> = new Map();

  constructor(private readonly roomId: string) {
    console.log(`[PeerManager] Created for room: ${roomId}`);
  }

  on(event: PeerEventType, handler: PeerEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => this.eventHandlers.get(event)?.delete(handler);
  }

  private fireEvent(event: PeerEventType, socketId: string, data?: RTCTrackEvent) {
    this.eventHandlers.get(event)?.forEach((h) => h(socketId, data));
  }

  createConnection(socketId: string, stream: MediaStream | null): RTCPeerConnection {
    if (this.peers.has(socketId)) return this.peers.get(socketId)!;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks immediately if stream is available
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // Remote audio
    pc.ontrack = (event) => {
      console.log(`[PeerManager] Got remote track from ${socketId}`, event.track.kind);
      if (event.track.kind === "audio") {
        this.attachRemoteAudio(socketId, event.streams[0]);
      }
      this.fireEvent("track", socketId, event);
    };

    // ICE — buffer candidates if not yet ready
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketManager.emit("ice-candidate", {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[PeerManager] ICE gathering: ${pc.iceGatheringState} (${socketId})`);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[PeerManager] Connection state with ${socketId}: ${state}`);
      if (state === "connected") {
        this.fireEvent("connected", socketId);
      } else if (state === "disconnected") {
        this.fireEvent("disconnected", socketId);
      } else if (state === "failed") {
        this.fireEvent("failed", socketId);
        this.closeConnection(socketId);
      }
    };

    this.peers.set(socketId, pc);
    this.iceCandidateBuffer.set(socketId, []);
    return pc;
  }

  async addTracksToConnection(socketId: string, stream: MediaStream): Promise<void> {
    const pc = this.peers.get(socketId);
    if (!pc) return;

    const senders = pc.getSenders();
    for (const track of stream.getTracks()) {
      const alreadySending = senders.some((s) => s.track?.id === track.id);
      if (!alreadySending) {
        pc.addTrack(track, stream);
      }
    }
  }

  async createOffer(socketId: string): Promise<void> {
    const pc = this.peers.get(socketId);
    if (!pc) return;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false, // video-ready: change to true when adding video
      });
      await pc.setLocalDescription(offer);
      socketManager.emit("offer", { to: socketId, offer });
      console.log(`[PeerManager] Sent offer to ${socketId}`);
    } catch (err) {
      console.error(`[PeerManager] createOffer failed for ${socketId}:`, err);
    }
  }

  async handleOffer(
    socketId: string,
    offer: RTCSessionDescriptionInit,
    stream: MediaStream | null
  ): Promise<void> {
    let pc = this.peers.get(socketId);
    if (!pc) {
      pc = this.createConnection(socketId, stream);
    } else if (stream) {
      // Ensure tracks are added even on renegotiation
      await this.addTracksToConnection(socketId, stream);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // Flush buffered ICE candidates now that remote description is set
      await this.flushIceCandidates(socketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketManager.emit("answer", { to: socketId, answer });
      console.log(`[PeerManager] Sent answer to ${socketId}`);
    } catch (err) {
      console.error(`[PeerManager] handleOffer failed for ${socketId}:`, err);
    }
  }

  async handleAnswer(
    socketId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = this.peers.get(socketId);
    if (!pc) {
      console.warn(`[PeerManager] handleAnswer: no peer for ${socketId}`);
      return;
    }
    if (pc.signalingState !== "have-local-offer") {
      console.warn(`[PeerManager] handleAnswer: wrong state ${pc.signalingState} for ${socketId}`);
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.flushIceCandidates(socketId);
      console.log(`[PeerManager] Set remote answer from ${socketId}`);
    } catch (err) {
      console.error(`[PeerManager] handleAnswer failed for ${socketId}:`, err);
    }
  }

  async handleIceCandidate(
    socketId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peers.get(socketId);
    if (!pc) return;

    // If remote description isn't set yet, buffer the candidate
    if (!pc.remoteDescription) {
      const buffer = this.iceCandidateBuffer.get(socketId) ?? [];
      buffer.push(candidate);
      this.iceCandidateBuffer.set(socketId, buffer);
      console.log(`[PeerManager] Buffered ICE candidate for ${socketId}`);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error(`[PeerManager] addIceCandidate failed for ${socketId}:`, err);
    }
  }

  private async flushIceCandidates(socketId: string): Promise<void> {
    const pc = this.peers.get(socketId);
    const buffer = this.iceCandidateBuffer.get(socketId) ?? [];
    if (!pc || buffer.length === 0) return;

    console.log(`[PeerManager] Flushing ${buffer.length} buffered ICE candidates for ${socketId}`);
    for (const candidate of buffer) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[PeerManager] Failed to flush ICE candidate:", err);
      }
    }
    this.iceCandidateBuffer.set(socketId, []);
  }

  async renegotiateAll(stream: MediaStream): Promise<void> {
    console.log(`[PeerManager] Renegotiating with ${this.peers.size} peers`);
    for (const socketId of this.peers.keys()) {
      await this.addTracksToConnection(socketId, stream);
      await this.createOffer(socketId);
    }
  }

  closeConnection(socketId: string): void {
    const pc = this.peers.get(socketId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      this.peers.delete(socketId);
    }

    const audio = this.remoteAudioElements.get(socketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.parentNode?.removeChild(audio);
      this.remoteAudioElements.delete(socketId);
    }

    this.iceCandidateBuffer.delete(socketId);
  }

  closeAll(): void {
    for (const socketId of [...this.peers.keys()]) {
      this.closeConnection(socketId);
    }
    this.eventHandlers.clear();
    console.log(`[PeerManager] Closed all connections for room: ${this.roomId}`);
  }

  hasPeer(socketId: string): boolean {
    return this.peers.has(socketId);
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  private attachRemoteAudio(socketId: string, stream: MediaStream): void {
    // Remove stale element
    const existing = this.remoteAudioElements.get(socketId);
    if (existing) {
      existing.pause();
      existing.srcObject = null;
      existing.parentNode?.removeChild(existing);
    }

    const audio = document.createElement("audio");
    audio.id = `remote-audio-${socketId}`;
    audio.autoplay = true;
    audio.muted = false;
    audio.volume = 1.0;
    // playsInline needed on iOS
    audio.setAttribute("playsinline", "");

    audio.srcObject = stream;

    // Some browsers need explicit play() call after srcObject assignment
    audio.onloadedmetadata = () => {
      audio.play().catch((err) => {
        console.warn(`[PeerManager] Audio autoplay blocked for ${socketId}:`, err);
        // Retry on next user interaction
        const retry = () => {
          audio.play().catch(console.error);
          document.removeEventListener("click", retry);
        };
        document.addEventListener("click", retry, { once: true });
      });
    };

    // Hide from layout but keep it in DOM for audio routing
    audio.style.cssText = "position:absolute;width:0;height:0;opacity:0;pointer-events:none;";
    document.body.appendChild(audio);
    this.remoteAudioElements.set(socketId, audio);

    console.log(`[PeerManager] Attached remote audio for ${socketId}`);
  }
}