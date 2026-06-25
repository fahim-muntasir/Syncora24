// libs/socket/SocketManager.ts
import { io, Socket } from "socket.io-client";

type EventHandler = (...args: unknown[]) => void;
export type ConnectionState = "connected" | "disconnected" | "reconnecting" | "error";

interface PendingListener {
  event: string;
  handler: EventHandler;
}

export class SocketManager {
  private static instance: SocketManager | null = null;
  private socket: Socket | null = null;
  private connectionState: ConnectionState = "disconnected";
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  // Queue listeners registered before connect() is called
  private pendingListeners: PendingListener[] = [];

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): Socket {
    if (this.socket?.connected) return this.socket;
    // If socket exists but is disconnected, reuse it
    if (this.socket) return this.socket;

    const url =
      process.env.NODE_ENV === "production"
        ? undefined
        : process.env.NEXT_PUBLIC_API_URL;

    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket"],
      autoConnect: true,
    });

    // Attach lifecycle listeners
    this.socket.on("connect", () => {
      console.info(`[SocketManager] Connected (id: ${this.socket?.id})`);
      this.setState("connected");
    });
    this.socket.on("disconnect", (reason) => {
      console.warn(`[SocketManager] Disconnected: ${reason}`);
      this.setState("disconnected");
    });
    this.socket.on("reconnect_attempt", () => this.setState("reconnecting"));
    this.socket.on("connect_error", (err) => {
      console.error("[SocketManager] Connection error:", err.message);
      this.setState("error");
    });
    this.socket.on("reconnect", () => {
      console.info("[SocketManager] Reconnected.");
      this.setState("connected");
    });

    // Flush pending listeners that were registered before connect()
    for (const { event, handler } of this.pendingListeners) {
      this.socket.on(event, handler);
    }
    this.pendingListeners = [];

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn(`[SocketManager] emit "${event}" skipped — not connected`);
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.socket) {
      // Queue until connect() is called
      this.pendingListeners.push({ event, handler });
      return () => {
        this.pendingListeners = this.pendingListeners.filter(
          (p) => !(p.event === event && p.handler === handler)
        );
      };
    }
    this.socket.on(event, handler);
    return () => this.socket?.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.socket?.off(event, handler);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(state: ConnectionState): void {
    this.connectionState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setState("disconnected");
  }
}

export const socketManager = SocketManager.getInstance();