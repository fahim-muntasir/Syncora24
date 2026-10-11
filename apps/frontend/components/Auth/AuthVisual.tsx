"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Globe2, Scale, ShieldCheck } from "lucide-react";

const copy = {
  signin: {
    title: "Pick up where you left off.",
    body: "Your rooms, languages and practice partners are waiting for you.",
  },
  signup: {
    title: "Your next conversation starts here.",
    body: "Create an account to join live rooms or host your own.",
  },
};

const features = [
  { Icon: Globe2, text: "Live rooms by language and level" },
  { Icon: Scale, text: "Debate rooms with For and Against sides" },
  { Icon: ShieldCheck, text: "Actively moderated and safe for everyone" },
];

const GREEN = "#4ade80";
const HAIRLINE = "rgba(255,255,255,0.08)";
const BAR_HEIGHTS = [5, 7, 9, 11];

function Meter({ x, y, filled }: { x: number; y: number; filled: number }) {
  return (
    <>
      {BAR_HEIGHTS.map((h, i) => (
        <rect
          key={i}
          x={x + i * 6}
          y={y - h}
          width={3}
          height={h}
          rx={1}
          fill={i < filled ? GREEN : "rgba(255,255,255,0.14)"}
        />
      ))}
    </>
  );
}

function Illustration() {
  return (
    <svg
      viewBox="0 0 520 410"
      className="h-auto w-full max-w-[520px]"
      aria-hidden="true"
      fill="none"
    >
      <rect x="20" y="20" width="380" height="180" rx="16" fill="#161616" stroke={HAIRLINE} />
      <Meter x={48} y={62} filled={3} />
      <text x="78" y="62" fontSize="11" fill="#d1d5db">Advanced</text>
      <line x1="140" y1="52" x2="140" y2="63" stroke="rgba(255,255,255,0.1)" />
      <text x="152" y="62" fontSize="11" fill="#9ca3af">Spanish</text>
      <text x="372" y="62" fontSize="11" fill="#9ca3af" textAnchor="end">4/6</text>
      <text x="48" y="96" fontSize="15" fontWeight="500" fill="#ffffff">
        Remote work beats the office
      </text>
      <rect x="48" y="116" width="154" height="44" rx="8" fill="rgba(74,222,128,0.06)" stroke="rgba(74,222,128,0.4)" />
      <text x="68" y="143" fontSize="12" fontWeight="500" fill="#86efac">For</text>
      <rect x="214" y="116" width="154" height="44" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
      <text x="234" y="143" fontSize="12" fontWeight="500" fill="#9ca3af">Against</text>


      <rect x="100" y="180" width="400" height="214" rx="16" fill="#161616" stroke={HAIRLINE} />
      <Meter x={124} y={214} filled={2} />
      <text x="154" y="214" fontSize="11" fill="#d1d5db">Intermediate</text>
      <line x1="232" y1="204" x2="232" y2="215" stroke="rgba(255,255,255,0.1)" />
      <text x="244" y="214" fontSize="11" fill="#9ca3af">English</text>
      <text x="476" y="214" fontSize="11" fill="#9ca3af" textAnchor="end">4/5</text>
      <text x="124" y="248" fontSize="15" fontWeight="500" fill="#ffffff">
        Weekend English conversation
      </text>

      {[0, 1, 2, 3].map((i) => {
        const x = 124 + i * 70;
        const speaking = i === 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={268}
              width={56}
              height={56}
              rx={12}
              fill="rgba(255,255,255,0.035)"
              stroke={speaking ? "rgba(74,222,128,0.55)" : HAIRLINE}
            />
            <circle cx={x + 28} cy={290} r={9} fill={speaking ? GREEN : "rgba(255,255,255,0.28)"} opacity={speaking ? 0.7 : 1} />
            <path
              d={`M${x + 10} 324 a18 14 0 0 1 36 0 z`}
              fill={speaking ? GREEN : "rgba(255,255,255,0.28)"}
              opacity={speaking ? 0.7 : 1}
            />
          </g>
        );
      })}
      <rect x="404" y="268" width="56" height="56" rx="12" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
      <circle cx="432" cy="296" r="3" fill="rgba(255,255,255,0.12)" />

      <line x1="124" y1="344" x2="476" y2="344" stroke="rgba(255,255,255,0.06)" />
      <text x="124" y="372" fontSize="11" fill="#6b7280">Open conversation</text>
      <text x="476" y="372" fontSize="11" fontWeight="500" fill={GREEN} textAnchor="end">
        Join room →
      </text>
    </svg>
  );
}

export default function AuthVisual() {
  const pathname = usePathname();
  const content = pathname?.includes("signup") ? copy.signup : copy.signin;

  return (
    <aside
      aria-label="About Syncora24"
      className="relative hidden overflow-hidden border-l border-white/[0.06] lg:block bg-[#111111]/80 backdrop-blur-md"
    >
      <div className="relative flex h-full min-h-screen flex-col items-center justify-center gap-10 px-12 py-16">
        <Illustration />

        <div className="w-full max-w-[520px]">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            {content.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            {content.body}
          </p>

          <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-6">
            {features.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-400">
                <Icon size={15} className="shrink-0 text-green-400" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}