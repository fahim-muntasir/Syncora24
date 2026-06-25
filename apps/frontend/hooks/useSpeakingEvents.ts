import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAppDispatch } from "@/libs/hooks";
import {
  setSpeakingUser,
  removeSpeakingUser,
} from "@/libs/features/room/roomSlice";

export function useSpeakingEvents(roomId: string) {
  const { on } = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleSpeaking = ({
      userId,
      speaking,
    }: {
      userId: string;
      speaking: boolean;
    }) => {
      console.log(
        `User ${userId} is ${speaking ? "speaking" : "not speaking"}`,
      );
      if (speaking) {
        dispatch(setSpeakingUser(userId));
      } else {
        dispatch(removeSpeakingUser(userId));
      }
    };

    const unsubSpeaking = on("user-speaking", (payload: unknown) => {
      const data = payload as {
        roomId: string;
        userId: string;
        speaking: boolean;
      };
      if (data.roomId === roomId) {
        handleSpeaking(data);
      }
    });

    return () => {
      unsubSpeaking();
    };
  }, [on, roomId, dispatch]);
}
