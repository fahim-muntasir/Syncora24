"use client";
import React from "react";

export default function Hero() {

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 md:pb-10 md:pt-20 lg:px-8">
        <div className="text-center">
          <h1
            className={`mb-4 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl`}
          >
            Practice speaking
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>with real people</span>
          </h1>

          <p
            className={`mx-auto max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg`}
          >
            Jump into live conversation rooms. Speak, listen and level up with
            learners and natives worldwide.
          </p>
        </div>
      </div>
    </section>
  );
}