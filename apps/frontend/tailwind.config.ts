import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        goldman: ['var(--font-goldman)', ...fontFamily.sans],
      },
      colors: {
        background: "#1C1C1C",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        secondary: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
          light: "#60a5fa",
        },
        danger: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          light: "#f87171",
        },
        gray: {
          300: "#d1d5db",
          400: "#9ca3af",
          700: "#374151",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
