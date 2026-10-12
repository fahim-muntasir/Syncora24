"use client";

import { ShieldAlert, LogOut } from "lucide-react";

type RoomKickedModalProps = {
  isOpen: boolean;
  onLeave: () => void;
};

export default function RoomKickedModal({ isOpen, onLeave }: RoomKickedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-kicked-title"
    >
      <div className="absolute inset-0 bg-[#0b0b0b]/85" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
            <ShieldAlert size={20} className="text-red-400" />
          </div>

          <h2 id="room-kicked-title" className="text-base font-semibold text-white">
            You were removed from this room
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            A room administrator or moderator removed you from this conversation. You can no
            longer rejoin this room.
          </p>

          <button
            type="button"
            onClick={onLeave}
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-4 text-sm font-medium text-gray-200 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
          >
            <LogOut size={14} />
            Back to rooms
          </button>
        </div>
      </div>
    </div>
  );
}