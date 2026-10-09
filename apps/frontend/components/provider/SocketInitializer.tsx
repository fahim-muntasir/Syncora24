"use client";

import { useEffect } from "react";
import { publicSocketManager, roomSocketManager } from "@/libs/socket/index";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { useRefreshTokenMutation } from "@/libs/features/auth/authApiSlice";
import { userLoggedIn, userLoggedOut } from "@/libs/features/auth/authSlice";

export default function SocketInitializer() {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshTokenMutation();

  useEffect(() => {
    publicSocketManager.connect();
  }, []);

  useEffect(() => {
    if (token) {
      const socket = roomSocketManager.connect(token);
      let refreshAttempted = false;
      let cancelled = false;
      const handleConnectError = (error: Error) => {
        if (
          refreshAttempted ||
          !error.message.toLowerCase().includes("access token has expired")
        ) {
          return;
        }

        refreshAttempted = true;
        void refreshToken()
          .unwrap()
          .then((response) => {
            if (cancelled) return;

            const { token: refreshedToken, user } = response.data;
            localStorage.setItem(
              "auth",
              JSON.stringify({ token: refreshedToken, user }),
            );
            roomSocketManager.connect(refreshedToken);
            dispatch(userLoggedIn({ token: refreshedToken, user }));
          })
          .catch((error: unknown) => {
            if (cancelled) return;

            console.warn("[SocketInitializer] Socket token refresh failed:", error);
            localStorage.removeItem("auth");
            dispatch(userLoggedOut());
            window.location.href = "/auth/signin";
          });
      };

      socket.on("connect_error", handleConnectError);
      return () => {
        cancelled = true;
        socket.off("connect_error", handleConnectError);
      };
    } else {
      roomSocketManager.disconnect();
    }
  }, [token, refreshToken, dispatch]);

  return null;
}