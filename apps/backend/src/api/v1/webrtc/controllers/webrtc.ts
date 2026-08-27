import { Request, Response } from "express";

export const getIceServersController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const apiKey = process.env.METERED_TURN_API_KEY;

    if (!apiKey) {
      console.error("[WebRTC] METERED_TURN_API_KEY is missing");

      res.status(500).json({
        success: false,
        message: "TURN server configuration is unavailable",
      });

      return;
    }

    const response = await fetch(
      `https://syncora24.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
    );

    if (!response.ok) {
      console.error(
        `[WebRTC] Failed to fetch TURN credentials: ${response.status}`,
      );

      res.status(502).json({
        success: false,
        message: "Failed to retrieve TURN credentials",
      });

      return;
    }

    const iceServers = await response.json();

    res.status(200).json({
      success: true,
      data: iceServers,
    });
  } catch (error) {
    console.error(
      "[WebRTC] Failed to retrieve ICE servers:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve ICE servers",
    });
  }
};