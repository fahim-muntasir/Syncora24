"use client";

import React from "react";
import { CheckCircle2, LogOut, Users } from "lucide-react";

type RoomEndedModalProps = {
  isOpen: boolean;
  onLeave: () => void;
};

export default function RoomEndedModal({
  isOpen,
  onLeave,
}: RoomEndedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-ended-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616] shadow-2xl shadow-black/60">
        <div className="absolute inset-x-0 top-0 h-px bg-green-500/30" />

        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
            <CheckCircle2 size={20} className="text-green-400" />
          </div>

          <h2
            id="room-ended-title"
            className="text-base font-semibold text-white"
          >
            This room has ended
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            The host has ended this conversation. The voice session is no
            longer active.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
              <Users size={14} className="text-gray-500" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-300">
                Conversation ended
              </p>

              <p className="mt-0.5 text-[10px] text-gray-600">
                You can return to the room list and join another room.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLeave}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/[0.1] hover:text-white"
          >
            <LogOut size={13} />
            Back to rooms
          </button>
        </div>
      </div>
    </div>
  );
}