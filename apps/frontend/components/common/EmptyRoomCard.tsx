import React from "react";
import { Plus, Globe2, Users } from "lucide-react";

const EmptyRoomCard = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[360px] mt-8 relative overflow-hidden rounded-2xl">
      {/* Background texture */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-[#161616]" />
      <div
        className="absolute inset-0 rounded-2xl opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
      {/* Center glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Floating icon cluster */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Orbiting language icons */}
          <div className="absolute inset-0 rounded-full border border-white/[0.06] animate-spin" style={{ animationDuration: '12s' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Globe2 size={8} className="text-purple-400" />
            </div>
          </div>
          <div className="absolute w-14 h-14 rounded-full border border-white/[0.06] animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Users size={6} className="text-green-400" />
            </div>
          </div>
          {/* Center icon */}
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Copy */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-2">No rooms yet</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Be the first to create a room and start a live language conversation.
          </p>
        </div>

        {/* Language hints */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {['🇯🇵 Japanese', '🇧🇷 Portuguese', '🇫🇷 French', '🇩🇪 German'].map((lang) => (
            <span
              key={lang}
              className="text-xs text-gray-500 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full"
            >
              {lang}
            </span>
          ))}
        </div>

        {/* Hint text */}
        <p className="text-xs text-gray-600">
          Click{' '}
          <span className="text-green-500 font-medium">+ Create Room</span>
          {' '}in the top bar to get started
        </p>
      </div>
    </div>
  );
};

export default EmptyRoomCard;