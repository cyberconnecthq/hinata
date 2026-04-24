import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#0C0B0A",
          900: "#121110",
          850: "#1A1815",
          800: "#22201C",
          700: "#2D2A25",
          600: "#3A3630",
          500: "#575149",
          400: "#7F786C",
          300: "#A8A093",
          200: "#CEC8BB",
          100: "#E8E3D7",
          50: "#F6F2E8",
        },
        lime: {
          DEFAULT: "#C8FF3D",
          dim: "#9DCC27",
          glow: "#E4FF8A",
        },
        amber: {
          DEFAULT: "#FFB547",
          dim: "#CC8A2A",
        },
        teal: {
          DEFAULT: "#4FD1C5",
          dim: "#2EA89D",
        },
        rose: {
          DEFAULT: "#FF6B6B",
          dim: "#C43F3F",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(200,255,61,0.25), 0 8px 32px -8px rgba(200,255,61,0.35)",
        tile: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
