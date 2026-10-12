import React from "react";

const circle = (cx: number, cy: number, r: number) => {
  const gap = r >= 6 ? 1.4 : 0;
  return `M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0a${r} ${r} 0 0 1 ${-2 * r + gap} ${gap ? 2.2 : 0}`;
};

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const GLYPHS = {
  bubble:
    "M8 10c0-2.5 2-4.5 4.5-4.5h23c2.5 0 4.5 2 4.5 4.5v15c0 2.5-2 4.5-4.5 4.5H24l-8.5 8v-8H12.5C10 29.5 8 27.5 8 25zM15 14h18M15 21h11",
  bubbleDots: `M6 12c0-3 2-5 5-5h26c3 0 5 2 5 5v14c0 3-2 5-5 5H22l-8 7v-7h-3c-3 0-5-2-5-5z${circle(16, 19, 1.2)}${circle(24, 19, 1.2)}${circle(32, 19, 1.2)}`,
  talk: `${circle(15, 18, 7)}M3 43v-5a12 12 0 0 1 24 0v5M30 6h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4l-4 4v-4h-2a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4zM31 11h8M31 14h5`,
  chatPeople: `${circle(14, 16, 6)}${circle(36, 16, 6)}M4 41v-3a10 10 0 0 1 20 0v3M26 41v-3a10 10 0 0 1 20 0v3`,
  lips: "M5 24c6-8 11-9 19-5 8-4 13-3 19 5-6 9-13 12-19 12S11 33 5 24zM5 24c8 2.5 11 3.5 19 3.5s11-1 19-3.5",
  waves: "M5 20v8M11 14v20M17 7v34M23 15v18M29 10v28M35 17v14M41 21v6",
  megaphone: "M6 20v8h8l16 10V10L14 20zM36 18c3 3 3 9 0 12M14 28l3 12h5l-3-10",
  hashtag: "M17 8l-4 32M31 8l-4 32M8 18h34M6 30h34",
  atSign: `${circle(24, 24, 6)}M30 18v9a4 4 0 0 0 8 0v-3A14 14 0 1 0 31 36`,
  bell: "M12 34c3-3 4-7 4-12a8 8 0 0 1 16 0c0 5 1 9 4 12zM20 38a4 4 0 0 0 8 0M24 10v4",

  // Devices and media
  phone: `${rrect(14, 4, 20, 40, 4)}M21 8.5h6M21 39.5h6M19 17h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-4l-3 3v-3h-3a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z`,
  headphones: `M9 28v-4a15 15 0 0 1 30 0v4${rrect(6, 26, 8, 13, 3)}${rrect(34, 26, 8, 13, 3)}`,
  mic: `${rrect(18, 4, 12, 22, 6)}M12 22v2a12 12 0 0 0 24 0v-2M24 36v6M17 42h14M18 11h4M18 16h4`,
  videocam: `${rrect(4, 14, 28, 22, 4)}M32 22l12-7v20l-12-7z${circle(18, 25, 4.5)}`,
  camera: `${rrect(5, 14, 38, 26, 4)}M17 14l2.5-5h9l2.5 5${circle(24, 27, 7)}`,
  note: `M18 35V11l20-4v24M18 19l20-4${ellipse(13, 35, 5, 4)}${ellipse(33, 31, 5, 4)}`,
  laptop: `${rrect(8, 12, 32, 22, 2)}M3 38h42M20 38l1 2h6l1-2`,

  // Space
  astronaut: `${circle(24, 14, 10)}${rrect(18, 10, 12, 8, 4)}${rrect(14, 26, 20, 14, 4)}M14 30l-6 6M34 30l6 6M20 40v5M28 40v5M21 33h6`,
  rocket: `M24 4c6 5 8 12 8 20l-3 8H19l-3-8c0-8 2-15 8-20zM19 32l-6 6V28l3-4M29 32l6 6V28l-3-4M24 36v8${circle(24, 17, 3.5)}`,
  ufo: "M10 28c0-6 6-10 14-10s14 4 14 10M4 30c0 3 9 5 20 5s20-2 20-5-9-4-20-4-20 1-20 4zM16 38l-3 5M24 38v6M32 38l3 5",
  satellite: `${rrect(18, 18, 12, 12, 2)}M6 14l7-7 7 7-7 7zM28 34l7-7 7 7-7 7zM18 21l-4-3M30 27l4 3M30 12a8 8 0 0 1 6 6`,
  planet: `${circle(24, 24, 10)}${ellipse(24, 24, 20, 6)}`,
  comet: `${circle(34, 14, 7)}M28 20 6 42M24 14 8 30M34 24 20 40`,

  // Travel and city
  airplane:
    "M24 4c2 0 3 2 3 4v12l15 9v4l-15-4v10l5 4v3l-8-2-8 2v-3l5-4V29L6 33v-4l15-9V8c0-2 1-4 3-4z",
  road: "M18 5 5 44M30 5l13 39M24 7v6M24 19v7M24 33v9",
  car: `M4 33v-9l6-10h22l7 10h5v9zM13 24h22${circle(14, 34, 4.5)}${circle(34, 34, 4.5)}`,
  bus: `${rrect(5, 8, 38, 30, 4)}M5 24h38M14 8v16M24 8v16M34 8v16${circle(14, 40, 3.5)}${circle(34, 40, 3.5)}`,
  signpost: "M24 4v40M10 10h24l5 5-5 5H10zM38 26H14l-5 5 5 5h24z",
  trafficLight: `${rrect(14, 4, 20, 40, 5)}${circle(24, 13, 4)}${circle(24, 24, 4)}${circle(24, 35, 4)}`,
  suitcase: `${rrect(6, 14, 36, 26, 4)}M17 14v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 26h36M21 26v4h6v-4`,
  compass: `${circle(24, 24, 18)}M31 17l-4 10-10 4 4-10z`,
  mountain: "M4 40 18 14l8 14 5-7 13 19zM15 21l3 4 3-4",
  tree: `M24 44V28M24 34l-7-6M24 30l7-6${ellipse(24, 16, 12, 11)}`,

  // Light
  bulb: "M24 5a12 12 0 0 0-7 21.5V31h14v-4.5A12 12 0 0 0 24 5zM18 36h12M20 41h8",
  streetlight:
    "M12 44h14M19 44V12c0-4 3-6 7-6h8M30 6h12l-3 8h-6zM36 18v4M31 17l-2 3M41 17l2 3",
  lamp: "M16 8h16l6 20H10zM24 28v12M15 44h18M24 3v2",
  lantern: "M18 6h12M20 6v4h8V6M14 10h20l-2 28H16zM14 18h20M14 30h20M24 38v6",

  // Everyday objects
  sunglasses:
    "M5 17h16v8a8 8 0 0 1-16 0zM27 17h16v8a8 8 0 0 1-16 0zM21 20c2-2 4-2 6 0M5 17 2 13M43 17l3-4",
  tshirt: "M17 6c1 3 3 4 7 4s6-1 7-4l11 4-4 9-6-2v21H16V17l-6 2-4-9z",
  coffee:
    "M9 18h24v10a10 10 0 0 1-10 10h-4A10 10 0 0 1 9 28zM33 21h3a5 5 0 0 1 0 10h-3M16 12c-2-2 2-3 0-6M24 12c-2-2 2-3 0-6M8 43h26",
  globe: `${circle(24, 24, 17)}${ellipse(24, 24, 7, 17)}M7 24h34M10 15h28M10 33h28`,
  book: "M24 12c-5-4-11-5-17-3v26c6-2 12-1 17 3 5-4 11-5 17-3V9c-6-2-12-1-17 3zM24 12v26M12 17h7M12 23h7M29 17h7M29 23h7",
  envelope: "M5 12h38v26H5zM5 13l19 14 19-14",
  pencil: "M9 39l2-9L33 8a3.5 3.5 0 0 1 5 0l2 2a3.5 3.5 0 0 1 0 5L18 37zM28 13l7 7",
  cloud: "M14 36a8 8 0 0 1-1-16 11 11 0 0 1 21-2 8.5 8.5 0 0 1 2 18z",
  plane: "M43 6 6 21l13 5 5 14zM43 6 19 26",
  umbrella: "M6 25a18 18 0 0 1 36 0c-3-3-6-3-9 0-3-3-6-3-9 0-3-3-6-3-9 0-3-3-6-3-9 0zM24 25v12a4 4 0 0 1-8 0",
  clock: `${circle(24, 24, 17)}M24 14v10l7 4`,
  key: `${circle(14, 24, 7)}M21 24h22M36 24v6M43 24v5`,
  lock: `${rrect(9, 21, 30, 22, 4)}M15 21v-6a9 9 0 0 1 18 0v6M24 29v6`,
  balloon:
    "M24 5c-8 0-12 6-12 12 0 7 6 13 12 13s12-6 12-13c0-6-4-12-12-12zM24 30l-2 4h4zM24 34c-3 4 3 6 0 10",
  gift: `${rrect(7, 20, 34, 22, 2)}M5 14h38v6H5zM24 14v28M24 14c-4-8-12-6-9-2 2 2 9 2 9 2zM24 14c4-8 12-6 9-2-2 2-9 2-9 2z`,
  house: "M6 24 24 8l18 16M10 22v20h28V22M20 42V30h8v12",
  calendar: `${rrect(6, 10, 36, 32, 4)}M6 19h36M15 6v8M33 6v8`,
  pin: `M24 44C14 32 10 26 10 19a14 14 0 0 1 28 0c0 7-4 13-14 25z${circle(24, 19, 5)}`,
  eye: `M4 24c6-10 14-14 20-14s14 4 20 14c-6 10-14 14-20 14S10 34 4 24z${circle(24, 24, 6)}`,
  crown: "M6 36l-1-20 12 10 7-14 7 14 12-10-1 20z",
  iceCream: "M14 22a10 10 0 0 1 20 0zM14 22l10 22 10-22M19 22l5 12 5-12",
  flower: `${circle(24, 13, 5)}${circle(35, 21, 5)}${circle(31, 34, 5)}${circle(17, 34, 5)}${circle(13, 21, 5)}${circle(24, 24, 3)}`,
  leaf: "M8 40C8 20 20 8 40 8c0 20-12 32-32 32zM8 40l20-20",

  // Symbols
  heart: "M24 40C10 30 6 22 6 16a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 6-4 14-18 24z",
  smiley: `${circle(24, 24, 17)}M17 20v2.5M31 20v2.5M15 29c3 5 15 5 18 0`,
  star: "M24 5l5.5 12 13 1.5-9.7 8.9 2.7 12.9L24 33.5 12.5 40.3l2.7-12.9-9.7-8.9 13-1.5z",
  sparkle:
    "M24 5c1.2 9 4.5 14 13 19-8.5 5-11.8 10-13 19-1.2-9-4.5-14-13-19 8.5-5 11.8-10 13-19z",
  moon: "M32 8a16 16 0 1 0 8 26A16 16 0 0 1 32 8z",
  sun: `${circle(24, 24, 8)}M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4`,
  bolt: "M27 4 11 27h12l-2 17 16-24H25z",

  // Tiny accents
  plus: "M24 15v18M15 24h18",
  cross: "M17 17l14 14M31 17 17 31",
  ring: circle(24, 24, 8),
  dot: circle(24, 24, 2.5),
  triangle: "M24 14 36 34H12z",
  dashes: "M8 24h6M20 24h6M32 24h6",
  squiggle: "M5 26c5-9 8 9 13 0s8 9 13 0 8 9 12 0",
  zigzag: "M6 30l6-12 6 12 6-12 6 12 6-12",
};

type GlyphName = keyof typeof GLYPHS;

const TILE = 880;
const SEED = 0x5e0c0a;
const MIN_GAP = 1.5;
const RADIUS = 0.43;
const OPACITY = 0.06;
const PATTERN_ID = "syncora-doodle-pattern";

const LARGE: GlyphName[] = [
  "astronaut", "rocket", "airplane", "house", "road", "streetlight", "globe", "book", "phone",
  "tshirt", "videocam", "headphones", "talk", "mic", "coffee", "chatPeople", "laptop", "umbrella",
  "gift", "clock", "bubbleDots", "car", "ufo", "mountain",
];
const MEDIUM: GlyphName[] = [
  "astronaut", "rocket", "airplane", "house", "road", "streetlight", "lamp", "lantern", "bulb",
  "satellite", "planet", "ufo", "car", "bus", "signpost", "trafficLight", "suitcase", "compass",
  "mountain", "tree", "bubble", "bubbleDots", "talk", "chatPeople", "phone", "headphones", "mic",
  "videocam", "camera", "sunglasses", "tshirt", "coffee", "globe", "book", "heart", "smiley", "lips",
  "note", "waves", "umbrella", "clock", "key", "lock", "balloon", "gift", "flower", "leaf", "moon",
  "sun", "bolt", "iceCream", "laptop", "bell", "pin", "megaphone", "eye", "crown", "calendar",
  "hashtag", "atSign", "pencil", "cloud", "plane", "envelope", "star", "sparkle", "comet",
];
const SMALL: GlyphName[] = [
  "astronaut", "rocket", "airplane", "house", "streetlight", "lamp", "lantern", "bulb", "satellite",
  "planet", "ufo", "comet", "car", "signpost", "trafficLight", "suitcase", "compass", "tree",
  "heart", "smiley", "star", "sparkle", "bubble", "bubbleDots", "note", "lips", "cloud", "plane",
  "envelope", "pencil", "camera", "sunglasses", "waves", "moon", "sun", "bolt", "key", "bell",
  "flower", "leaf", "iceCream", "hashtag", "atSign", "lock", "pin", "crown", "balloon", "clock",
];
const ACCENT: GlyphName[] = [
  "plus", "ring", "dot", "squiggle", "zigzag", "cross", "dashes", "triangle", "heart", "star",
  "sparkle", "moon", "bolt", "comet", "plane", "bulb", "leaf",
];
const FILL: GlyphName[] = [
  "plus", "ring", "dot", "cross", "dashes", "sparkle", "star", "heart", "triangle", "squiggle", "zigzag",
];
const MICRO: GlyphName[] = ["plus", "ring", "dot", "cross", "dot", "dashes"];

interface ClassSpec {
  pool: GlyphName[];
  count: number;
  size: [number, number];
  stroke: number;
  tries: number;
}

const CLASSES: ClassSpec[] = [
  { pool: LARGE, count: 22, size: [56, 68], stroke: 1.6, tries: 40 },
  { pool: MEDIUM, count: 150, size: [36, 48], stroke: 1.5, tries: 30 },
  { pool: SMALL, count: 160, size: [26, 32], stroke: 1.4, tries: 24 },
  { pool: ACCENT, count: 150, size: [14, 22], stroke: 1.3, tries: 20 },
  { pool: FILL, count: 320, size: [10, 15], stroke: 1.2, tries: 16 },
  { pool: MICRO, count: 340, size: [6, 9], stroke: 1.1, tries: 12 },
];

interface Doodle {
  key: string;
  glyph: GlyphName;
  size: number;
  strokeWidth: number;
  transform: string;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const wrap = (d: number) => {
  const a = Math.abs(d);
  return a > TILE / 2 ? TILE - a : a;
};

function buildDoodles(): Doodle[] {
  const rand = mulberry32(SEED);
  const placed: { x: number; y: number; r: number }[] = [];
  const doodles: Doodle[] = [];
  let id = 0;

  for (const spec of CLASSES) {
    let deck: GlyphName[] = [];
    const draw = () => {
      if (deck.length === 0) {
        deck = [...spec.pool];
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
      }
      return deck.pop() as GlyphName;
    };

    for (let n = 0; n < spec.count; n++) {
      const size = round1(spec.size[0] + rand() * (spec.size[1] - spec.size[0]));
      const r = size * RADIUS;

      let best = { x: 0, y: 0, score: -Infinity };
      for (let k = 0; k < spec.tries; k++) {
        const x = round1(rand() * TILE);
        const y = round1(rand() * TILE);
        let score = Infinity;
        for (const p of placed) {
          const gap =
            Math.sqrt(wrap(x - p.x) ** 2 + wrap(y - p.y) ** 2) - r - p.r;
          if (gap < score) score = gap;
        }
        if (score > best.score) best = { x, y, score };
      }

      const rotate = round1((rand() - 0.5) * 2 * (rand() < 0.2 ? 75 : 32));
      const flip = rand() < 0.5;
      const glyph = draw();

      if (best.score < MIN_GAP) continue;
      placed.push({ x: best.x, y: best.y, r });

      const reach = size * 0.75;
      for (const dx of [-TILE, 0, TILE]) {
        for (const dy of [-TILE, 0, TILE]) {
          const cx = best.x + dx;
          const cy = best.y + dy;
          if (cx + reach < 0 || cx - reach > TILE) continue;
          if (cy + reach < 0 || cy - reach > TILE) continue;

          doodles.push({
            key: `${id}:${dx}:${dy}`,
            glyph,
            size,

            strokeWidth: Math.round(((spec.stroke * 48) / size) * 100) / 100,
            transform: `translate(${cx} ${cy}) rotate(${rotate}) scale(${flip ? -1 : 1} 1) translate(${-size / 2} ${-size / 2})`,
          });
        }
      }
      id++;
    }
  }

  return doodles;
}

const DOODLES = buildDoodles();
const GLYPH_ENTRIES = Object.entries(GLYPHS);

export const BackgroundPattern: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#111111]"
    >
      <svg
        className="absolute inset-0 h-full w-full text-emerald-100 forced-colors:hidden print:hidden"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          {GLYPH_ENTRIES.map(([name, d]) => (
            <symbol
              key={name}
              id={`syn-g-${name}`}
              viewBox="0 0 48 48"
              overflow="visible"
            >
              <path d={d} />
            </symbol>
          ))}

          <pattern
            id={PATTERN_ID}
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {DOODLES.map((d) => (
                <use
                  key={d.key}
                  href={`#syn-g-${d.glyph}`}
                  width={d.size}
                  height={d.size}
                  strokeWidth={d.strokeWidth}
                  transform={d.transform}
                />
              ))}
            </g>
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill={`url(#${PATTERN_ID})`}
          opacity={OPACITY}
        />
      </svg>

    </div>
  );
};