import type { Config } from "tailwindcss";

/**
 * Pirton design system — "Living Security Console".
 * Deep-space near-black base with a LIVING brand spectrum (indigo → violet →
 * cyan) instead of one flat accent: gradient headlines, aurora glows, and
 * gradient-hairline glass. Cyan is the "signal" accent (motion, live state).
 * Semantic green/amber/red are reserved for the risk verdict only.
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
        // Deep-space backgrounds.
        bg: {
          DEFAULT: "#05070E", // page
          raised: "#0A0E1A", // solid fallback panels
          soft: "#0C1020",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.09)",
          soft: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.14)",
        },
        // Brand spectrum — indigo core.
        brand: {
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        // Violet — the mid of the spectrum (gradients, glows).
        violet: {
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        // Cyan — the "signal" accent: live/active/motion states.
        signal: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          glow: "rgba(34,211,238,0.35)",
        },
        // Verdict / semantic — used ONLY on results (brighter for dark).
        safe: { DEFAULT: "#34D399", tint: "rgba(52,211,153,0.12)", ring: "rgba(52,211,153,0.35)" },
        caution: { DEFAULT: "#FBBF24", tint: "rgba(251,191,36,0.12)", ring: "rgba(251,191,36,0.35)" },
        danger: { DEFAULT: "#F87171", tint: "rgba(248,113,113,0.12)", ring: "rgba(248,113,113,0.4)" },
      },
      fontFamily: {
        // Space Grotesk for display/headings — distinctive, futuristic.
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 1.5rem + 4vw, 5rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        hero: ["clamp(1.75rem, 1.2rem + 2.4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        step: ["clamp(2.5rem, 1.8rem + 3vw, 3.75rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 40px -12px rgba(0,0,0,0.7)",
        lift: "0 30px 80px -28px rgba(0,0,0,0.85)",
        glow: "0 10px 40px -10px rgba(99,102,241,0.55)",
        "glow-lg": "0 20px 70px -18px rgba(99,102,241,0.55)",
        signal: "0 10px 40px -12px rgba(34,211,238,0.5)",
        focus: "0 0 0 3px rgba(129,140,248,0.35)",
      },
      backgroundImage: {
        "brand-spectrum": "linear-gradient(120deg, #818CF8 0%, #A78BFA 45%, #22D3EE 100%)",
        "brand-spectrum-soft":
          "linear-gradient(120deg, rgba(129,140,248,0.9), rgba(167,139,250,0.9), rgba(34,211,238,0.9))",
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      maxWidth: {
        content: "48rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        twinkle: "twinkle 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        shimmer: "shimmer 2.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
