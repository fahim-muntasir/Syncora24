import React from 'react';
import { BackgroundPattern } from './background/BackgroundPattern';
import { BookOpenCheck } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <BackgroundPattern />
      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Logo mark with pulse ring */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute w-20 h-20 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Inner ring */}
          <div className="absolute w-14 h-14 rounded-full border border-green-500/30" />
          {/* Icon */}
          <div className="relative w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <BookOpenCheck className="w-6 h-6 text-green-400" />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-white font-semibold text-lg tracking-tight">Verbly</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-green-400 opacity-60"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}