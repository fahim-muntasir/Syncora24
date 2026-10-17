"use client";

import React from "react";
import { AlertTriangle, PhoneOff, X } from "lucide-react";

type EndRoomConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export default function EndRoomConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: EndRoomConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-room-title"
    >
      <div
        className="absolute inset-0 bg-[#0b0b0b]/85"
        onClick={isLoading ? undefined : onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>

          <div className="pr-8">
            <h2 id="end-room-title" className="text-base font-semibold text-white">
              End this room?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Ending this room closes the conversation for everyone inside. Participants are
              notified that the room has ended, and it stays in the room list as ended.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 rounded-lg border border-white/[0.1] px-4 text-sm font-medium text-gray-200 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              <PhoneOff size={14} />
              {isLoading ? "Ending…" : "End room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}