"use client";

import React from "react";
import { CheckCircle2, LogOut } from "lucide-react";

type RoomEndedModalProps = {
  isOpen: boolean;
  onLeave: () => void;
};

export default function RoomEndedModal({ isOpen, onLeave }: RoomEndedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-ended-title"
    >
      <div className="absolute inset-0 bg-[#0b0b0b]/85" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
            <CheckCircle2 size={20} className="text-green-400" />
          </div>

          <h2 id="room-ended-title" className="text-base font-semibold text-white">
            This room has ended
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            The host has ended this conversation. You can return to the room list and join
            another room.
          </p>

          <button
            type="button"
            onClick={onLeave}
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-medium text-white transition-colors hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
          >
            <LogOut size={14} />
            Back to rooms
          </button>
        </div>
      </div>
    </div>
  );
}