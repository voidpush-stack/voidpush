import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ghost:  "#a78bfa",
        ghost2: "#7c3aed",
        teal:   "#2dd4bf",
        muted:  "#64748b",
        bg:     "#080b10",
        bg2:    "#0d1117",
        bg3:    "#111820",
      },
      fontFamily: {
        mono:    ["Space Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      animation: {
        pulse2:   "pulse 2s infinite",
        blink:    "blink 1.1s step-end infinite",
        ticker:   "ticker 28s linear infinite",
        floatG:   "floatG 9s ease-in-out infinite",
        slideUp:  "slideUp 0.8s ease both",
        fadeUp:   "fadeUp 0.6s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
