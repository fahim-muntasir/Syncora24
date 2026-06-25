import React from 'react';

export const BackgroundPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base dark surface */}
      <div className="absolute inset-0 bg-[#111111]" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top-left ambient glow — green brand accent */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle at center, #22c55e 0%, transparent 70%)',
          animation: 'pulse-slow 8s ease-in-out infinite',
        }}
      />

      {/* Center-right ambient glow — purple accent */}
      <div
        className="absolute top-1/3 -right-48 w-[700px] h-[700px] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle at center, #a855f7 0%, transparent 70%)',
          animation: 'pulse-slow 10s ease-in-out infinite 2s',
        }}
      />

      {/* Bottom-center ambient glow */}
      <div
        className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)',
          animation: 'pulse-slow 12s ease-in-out infinite 4s',
        }}
      />

      {/* Vignette overlay — keeps edges dark */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, transparent 40%, #111111 100%)',
        }}
      />

      {/* Grain texture for premium depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.07; }
          50% { transform: scale(1.15); opacity: 0.13; }
        }
      `}</style>
    </div>
  );
};