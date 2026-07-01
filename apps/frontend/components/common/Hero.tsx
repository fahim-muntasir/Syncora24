"use client";
import React, { useEffect, useState } from "react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="text-center">

          {/* Main heading */}
          <h1
            className={`text-3xl sm:text-6xl lg:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Practice - Speaking
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
              }}
            >
              With Real People
            </span>
          </h1>

          {/* Sub-copy */}
          <p
            className={`text-gray-400 text-base sm:text-xl max-w-xl mx-auto mb-8 md:mb-12 leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Jump into live conversation rooms. Speak, listen, and level up — with learners and natives worldwide.
          </p>


          {/* Decorative divider */}
          <div className="md:mt-14 flex items-center gap-4 max-w-sm mx-auto">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-gray-600 text-xs uppercase tracking-widest font-medium">Open Rooms</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>

        </div>
      </div>
    </div>
  );
}