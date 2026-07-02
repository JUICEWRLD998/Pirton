import type { Config } from "tailwindcss";

/**
 * Pirton — "Living Security Console" design system.
 * Deep near-black base, glassmorphic elevation, one accent that shifts with
 * verdict state (emerald = safe → amber = caution → red = danger).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base — near-black, layered (not pure black).
        ink: {
          950: "#05060A",
          900: "#080A11",
          800: "#0C0F18",
          700: "#131826",
          600: "#1B2233",
          500: "#273047",
        },
        // Verdict accents.
        safe: {
          DEFAULT: "#2DD4BF", // teal-emerald
          soft: "#5EEAD4",
          deep: "#0D9488",
        },
        caution: {
          DEFAULT: "#F5B14C",
          soft: "#FCD34D",
          deep: "#B45309",
        },
        danger: {
          DEFAULT: "#F4523B",
          soft: "#FB7185",
          deep: "#B91C1C",
        },
        cyan: {
          glow: "#38E1FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 1.8rem + 3.4vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        hero: ["clamp(1.9rem, 1.4rem + 2.4vw, 3.4rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        glass: "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 0 1px rgba(56,225,255,0.25), 0 0 40px rgba(56,225,255,0.18)",
        lift: "0 24px 60px -20px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) rotate(0deg) scale(1)" },
          "33%": { transform: "translate3d(4%, -3%, 0) rotate(8deg) scale(1.15)" },
          "66%": { transform: "translate3d(-4%, 3%, 0) rotate(-6deg) scale(1.05)" },
        },
        "beam-flow": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        aurora: "aurora 22s ease-in-out infinite",
        "aurora-slow": "aurora 34s ease-in-out infinite",
        "beam-flow": "beam-flow 0.9s linear infinite",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
