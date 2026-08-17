"use client";

import { useEffect } from "react";
import { socketManager } from "@/libs/socket/index";

export default function SocketInitializer() {
  useEffect(() => {
    socketManager.connect();
  }, []);

  return null;
}