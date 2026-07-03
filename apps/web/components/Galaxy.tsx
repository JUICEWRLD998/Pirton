"use client";

import { useEffect, useRef } from "react";

/**
 * Deep-space galaxy backdrop: a few soft nebula clouds (CSS) + a performant
 * canvas starfield that slowly drifts and twinkles. GPU/CPU-light (a few dozen
 * to ~320 tiny arcs per frame, scaled to viewport area) and fully static under
 * prefers-reduced-motion. Fixed behind all content.
 */
export function Galaxy() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    type Star = { x: number; y: number; r: number; a: number; phase: number; tw: number; vy: number };
    let stars: Star[] = [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(320, Math.max(40, Math.round((w * h) / 6500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        tw: Math.random() * 0.9 + 0.4,
        vy: Math.random() * 0.1 + 0.02,
      }));
    };

    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * s.tw + s.phase);
        ctx.globalAlpha = s.a * tw;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.r > 1 ? "#c7d2fe" : "#e2e8f0";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      t += 0.016;
      for (const s of stars) {
        s.y += s.vy;
        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    build();
    if (reduce) draw();
    else raf = requestAnimationFrame(tick);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (reduce) draw();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      {/* nebula clouds — blue spectrum */}
      <div
        className="absolute left-1/2 top-[-12%] h-[62rem] w-[62rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,102,241,0.24), transparent 60%)" }}
      />
      <div
        className="absolute right-[-12%] top-[16%] h-[42rem] w-[42rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(56,140,248,0.18), transparent 60%)" }}
      />
      <div
        className="absolute left-[-10%] top-[48%] h-[40rem] w-[40rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 60%)" }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* vignette — deepen edges, keep content legible */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, transparent 42%, rgba(6,12,32,0.7) 100%)" }}
      />
    </div>
  );
}
