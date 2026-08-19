import React from "react";
import { BookOpenCheck } from "lucide-react";
import { BackgroundPattern } from "./background/BackgroundPattern";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <BackgroundPattern />

      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-white/60 [animation-duration:1.4s]" />

        <div className="absolute inset-2 animate-spin rounded-full border border-transparent border-b-white/20 [animation-duration:2s] [animation-direction:reverse]" />

        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-green-500/20 blur-md group-hover:blur-lg transition-all duration-300" />
          <div className="relative bg-green-500/10 border border-green-500/20 p-2 rounded-xl transition-all duration-300">
            <BookOpenCheck className="w-5 h-5 text-green-400/60" />
          </div>
        </div>
      </div>
    </div>
  );
}