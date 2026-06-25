// context/SocketContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { socketManager, ConnectionState } from "@/libs/socket/index";
import type { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  connectionState: ConnectionState;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  useEffect(() => {
    // Connect on mount
    socketManager.connect();
    setConnectionState(socketManager.getConnectionState());

    // Subscribe to state changes
    const unsub = socketManager.onStateChange(setConnectionState);
    return unsub;
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketManager.emit(event, data);
  }, []);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      return socketManager.on(event, handler);
    },
    []
  );

  const off = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketManager.off(event, handler);
    },
    []
  );

  return (
    <SocketContext.Provider
      value={{
        socket: socketManager.getSocket(),
        connectionState,
        emit,
        on,
        off,
        isConnected: connectionState === "connected",
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextValue => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};