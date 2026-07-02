"use client";

import { RefObject, useEffect, useRef } from "react";

interface Props {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  /** flowing = money/work in transit (paying/delivering); dim otherwise. */
  active?: boolean;
  /** stroke color (defaults to the console accent). */
  color?: string;
  /** delivered = solid confirmed line. */
  done?: boolean;
}

/**
 * A curved connection beam from `fromRef` to `toRef`, measured live against
 * `containerRef`. Updates imperatively via rAF so the beam tracks cards during
 * their spring entrance without re-rendering React on every frame.
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  active = false,
  color,
  done = false,
}: Props) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const flowRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const c = containerRef.current;
      const a = fromRef.current;
      const b = toRef.current;
      if (c && a && b && pathRef.current) {
        const cr = c.getBoundingClientRect();
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        // orchestrator: bottom-center → card: top-center
        const x1 = ar.left + ar.width / 2 - cr.left;
        const y1 = ar.bottom - cr.top - 6;
        const x2 = br.left + br.width / 2 - cr.left;
        const y2 = br.top - cr.top + 6;
        const midY = (y1 + y2) / 2;
        const d = `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
        pathRef.current.setAttribute("d", d);
        flowRef.current?.setAttribute("d", d);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [containerRef, fromRef, toRef]);

  const stroke = color ?? "rgb(var(--accent))";

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {/* base rail */}
      <path
        ref={pathRef}
        fill="none"
        stroke={done ? stroke : "rgba(255,255,255,0.10)"}
        strokeWidth={done ? 1.6 : 1.4}
        strokeLinecap="round"
        style={{ opacity: done ? 0.55 : 1, transition: "stroke 0.4s, opacity 0.4s" }}
      />
      {/* flowing overlay */}
      <path
        ref={flowRef}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="6 18"
        className={active ? "animate-beam-flow" : ""}
        style={{
          opacity: active ? 0.95 : 0,
          filter: `drop-shadow(0 0 6px ${stroke})`,
          transition: "opacity 0.4s",
        }}
      />
    </svg>
  );
}
