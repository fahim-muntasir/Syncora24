"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { PhoneOff } from "lucide-react";
import ToggleSwitch from "./ToggleSwitch";
import EndRoomConfirmModal from "@/components/practicezoon/Room/Modals/EndRoomConfirmModal";
import { useAppSelector } from "@/libs/hooks";
import { roomSocketManager } from "@/libs/socket/index";
import { RoomType } from "@/types/room";

const sectionTitle =
  "mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-500";

export default function HostControls({
  room,
  currentUserIsHost,
}: {
  room: RoomType | null;
  currentUserIsHost: boolean;
}) {
  const { id } = useParams();
  const roomId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
  const muteAll = useAppSelector((state) => state.room.muteAll);
  const cameraEnabled = useAppSelector((state) => state.room.cameraEnabled);
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);

  const handleConfirmEndRoom = () => {
    setIsEndingRoom(true);
    roomSocketManager.emit("end-room", { roomId });
    setShowEndRoomModal(false);
    setIsEndingRoom(false);
  };

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <p className="px-1 text-xs leading-relaxed text-gray-500">
        These settings apply to everyone in the room. To manage one person, open
        the menu next to their name.
      </p>

      <section>
        <h3 className={sectionTitle}>Audio</h3>
        <ToggleSwitch
          label="Mute everyone"
          description={
            muteAll
              ? "Everyone is muted. Turn off to let people speak."
              : "Mute every participant at once."
          }
          checked={muteAll}
          onChange={() =>
            roomSocketManager.emit("moderator-set-mute-all", {
              roomId,
              muteAll: !muteAll,
            })
          }
        />
      </section>

      <section>
        <h3 className={sectionTitle}>Video</h3>
        <ToggleSwitch
          label="Participant cameras"
          description={
            cameraEnabled
              ? "Participants can turn on their camera."
              : "Cameras are blocked for participants."
          }
          checked={cameraEnabled}
          onChange={() =>
            roomSocketManager.emit("moderator-set-camera", {
              roomId: room?.id,
              cameraEnabled: !cameraEnabled,
            })
          }
        />
      </section>

      {currentUserIsHost && (
        <section>
          <h3 className={sectionTitle}>Room</h3>
          <button
            type="button"
            onClick={() => setShowEndRoomModal(true)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500/60 motion-reduce:transition-none"
          >
            <PhoneOff size={15} />
            End room for everyone
          </button>
        </section>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <EndRoomConfirmModal
            isOpen={showEndRoomModal}
            onClose={() => setShowEndRoomModal(false)}
            onConfirm={handleConfirmEndRoom}
            isLoading={isEndingRoom}
          />,
          document.body,
        )}
    </div>
  );
}