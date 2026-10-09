// libs/socket/SocketManager.ts
import { io, Socket } from "socket.io-client";

type EventHandler = (...args: unknown[]) => void;
export type ConnectionState =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface PendingListener {
  event: string;
  handler: EventHandler;
}

type SocketResponse = {
  success: boolean;
  message?: string;
  code?: string;
};

export class SocketManager {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = "disconnected";
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private token: string | null = null;
  // Queue listeners registered before connect() is called
  private pendingListeners: PendingListener[] = [];

  constructor(
    private readonly namespace: "/public" | "/room",
    private readonly authenticated = false,
  ) {}

  connect(token?: string): Socket {
    if (this.authenticated) {
      this.token = token ?? this.token;
      if (!this.token) {
        throw new Error(`A JWT is required to connect to ${this.namespace}`);
      }
    }
    if (this.socket?.connected) return this.socket;
    if (this.socket) {
      if (!this.socket.connected && !this.socket.active) {
        this.socket.connect();
      }
      return this.socket;
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"
    ).replace(/\/+$/, "");
    const url = `${baseUrl}${this.namespace}`;

    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket"],
      autoConnect: true,
      ...(this.authenticated
        ? { auth: (callback) => callback({ token: this.token }) }
        : {}),
    });

    // Attach lifecycle listeners
    this.socket.on("connect", () => {
      console.info(`[SocketManager] Connected (id: ${this.socket?.id})`);
      this.setState("connected");
    });
    this.socket.on("disconnect", (reason) => {
      console.warn(`[SocketManager] Disconnected: ${reason}`);
      this.setState("reconnecting");
    });
    this.socket.on("reconnect_attempt", () => this.setState("reconnecting"));
    this.socket.on("connect_error", (err) => {
      console.warn("[SocketManager] Connection error:", err.message);
      this.setState("reconnecting");
    });
    this.socket.on("reconnect", () => {
      console.info("[SocketManager] Reconnected.");
      this.setState("connected");
    });

    // Retain listeners so a later authenticated reconnect restores subscriptions.
    for (const { event, handler } of this.pendingListeners) {
      this.socket.on(event, handler);
    }

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

  emitWithAck<TResponse extends SocketResponse>(
    event: string,
    data: unknown,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();

      if (!socket?.connected) {
        reject(new Error("Socket is not connected"));

        return;
      }

      socket.emit(event, data, (response: TResponse) => {
        if (!response) {
          reject(
            new Error("No response received from server"),
          );

          return;
        }

        if (!response.success) {
          const error = new Error(response.message ?? "Socket operation failed") as Error & {
            code?: string;
          };
          error.code = response.code;
          reject(error);

          return;
        }

        resolve(response);
      });
    });
  }

  on(event: string, handler: EventHandler): () => void {
    this.pendingListeners.push({ event, handler });
    this.socket?.on(event, handler);
    return () => {
      this.pendingListeners = this.pendingListeners.filter(
        (listener) =>
          !(listener.event === event && listener.handler === handler),
      );
      this.socket?.off(event, handler);
    };
  }

  off(event: string, handler: EventHandler): void {
    this.pendingListeners = this.pendingListeners.filter(
      (listener) =>
        !(listener.event === event && listener.handler === handler),
    );
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
    this.token = null;
    this.setState("disconnected");
  }
}

export const publicSocketManager = new SocketManager("/public");
export const roomSocketManager = new SocketManager("/room", true);
