import { useEffect } from "react";
import { roomSocketManager } from "@/libs/socket/index";
import { useAppDispatch } from "@/libs/hooks";
import {
  setSpeakingUser,
  removeSpeakingUser,
} from "@/libs/features/room/roomSlice";

export function useSpeakingEvents(roomId: string) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleSpeaking = ({
      roomId: eventRoomId,
      userId,
      speaking,
    }: {
      roomId: string;
      userId: string;
      speaking: boolean;
    }) => {
      if (eventRoomId !== roomId || !userId) return;
      console.log(
        `User ${userId} is ${speaking ? "speaking" : "not speaking"}`,
      );
      if (speaking) {
        dispatch(setSpeakingUser(userId));
      } else {
        dispatch(removeSpeakingUser(userId));
      }
    };

    const unsubSpeaking = roomSocketManager.on("user-speaking", (payload: unknown) => {
      const data = payload as {
        roomId: string;
        userId: string;
        speaking: boolean;
      };
      if (typeof data.speaking !== "boolean") return;
      handleSpeaking(data);
    });

    return () => {
      unsubSpeaking();
    };
  }, [roomId, dispatch]);
}
