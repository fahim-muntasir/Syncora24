import React from "react";
import { MessageCircle } from "lucide-react";

const EmptyRoomCard = () => {
  return (
    <div className="mt-8 flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161616] px-6 py-10 text-center md:mt-10">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]"
      >
        <MessageCircle className="h-5 w-5 text-gray-400" />
      </span>

      <h2 className="mt-5 text-base font-semibold text-white">No rooms yet</h2>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
        Be the first to create a room and start a live language conversation.
      </p>

      <p className="mt-6 border-t border-white/[0.06] pt-5 text-xs text-gray-500">
        Select <span className="font-medium text-green-400">Create room</span>{" "}
        in the top bar to get started.
      </p>
    </div>
  );
};

export default EmptyRoomCard;