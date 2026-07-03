/** Brand shield mark with the spectrum gradient. Static, no animation. */
export function ShieldMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-xl"
      style={{ width: size + 12, height: size + 12 }}
    >
      {/* gradient hairline frame */}
      <span
        className="absolute inset-0 rounded-xl opacity-90"
        style={{
          padding: 1,
          background:
            "linear-gradient(140deg, rgba(129,140,248,0.9), rgba(167,139,250,0.4), rgba(34,211,238,0.8))",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span
        className="absolute inset-[1px] rounded-[11px]"
        style={{ background: "radial-gradient(circle at 50% 20%, rgba(124,58,237,0.28), rgba(10,14,26,0.9))" }}
      />
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="relative">
        <defs>
          <linearGradient id="pirton-shield" x1="4" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C7D2FE" />
            <stop offset="0.5" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#67E8F9" />
          </linearGradient>
        </defs>
        <path
          d="M12 3 5 5.4v5.1C5 15.6 12 20 12 20s7-4.4 7-9.5V5.4L12 3Z"
          stroke="url(#pirton-shield)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="rgba(129,140,248,0.12)"
        />
        <path
          d="m8.8 11.8 2.3 2.4 4.1-5"
          stroke="url(#pirton-shield)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <ShieldMark size={20} />
      <span className="font-display text-[17px] font-semibold tracking-tight text-white">Pirton</span>
    </span>
  );
}
