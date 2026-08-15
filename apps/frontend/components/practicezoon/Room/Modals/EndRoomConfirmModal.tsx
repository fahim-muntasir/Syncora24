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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-room-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616] shadow-2xl shadow-black/60">
        <div className="absolute inset-x-0 top-0 h-px bg-red-500/40" />

        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>

          <div className="pr-8">
            <h2
              id="end-room-title"
              className="text-base font-semibold text-white"
            >
              End this room?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Ending this room will close the conversation for everyone
              currently inside. Participants will be notified that the room
              has ended.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <PhoneOff
                size={14}
                className="mt-0.5 flex-shrink-0 text-red-400/70"
              />

              <p className="text-[11px] leading-relaxed text-gray-500">
                This action will end the active voice session for all
                participants. You can still see the room as ended in the room
                list.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-xs font-medium text-gray-400 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex min-w-[100px] items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PhoneOff size={13} />

              {isLoading ? "Ending..." : "End room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}