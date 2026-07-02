"use client";

import { motion } from "framer-motion";

/**
 * Ambient "alive" layer behind the fold — a slow gradient-mesh aurora with a
 * faint grid, all GPU-friendly (transform/opacity only, no JS per frame).
 * Dims + slows once a scan starts so focus moves to the agents.
 */
export function AuroraBackground({ dim = false }: { dim?: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      animate={{ opacity: dim ? 0.35 : 1 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* base vignette */}
      <div className="absolute inset-0 bg-ink-950" />

      {/* aurora blobs */}
      <div className="absolute left-1/2 top-[-18%] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,225,255,0.28),transparent_62%)] blur-3xl animate-aurora" />
      <div className="absolute right-[6%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.22),transparent_60%)] blur-3xl animate-aurora-slow" />
      <div className="absolute left-[4%] top-[26%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_60%)] blur-3xl animate-aurora" />

      {/* faint grid for the "console" credibility */}
      <div className="absolute inset-0 bg-grid-faint [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]" />

      {/* film grain / darken toward bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />
    </motion.div>
  );
}
