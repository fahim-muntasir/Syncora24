"use client";

import { ShieldAlert, LogOut } from "lucide-react";

type RoomKickedModalProps = {
  isOpen: boolean;
  onLeave: () => void;
};

export default function RoomKickedModal({
  isOpen,
  onLeave,
}: RoomKickedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/20 bg-[#161616] shadow-2xl shadow-black/60">
        <div className="absolute inset-x-0 top-0 h-px bg-red-500/40" />
        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
            <ShieldAlert size={20} className="text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-white">You were removed from this room</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            A room administrator or moderator removed you from this conversation.
            You can no longer rejoin this room.
          </p>
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
