"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's signature: a live "swarm" constellation on a canvas. A central
 * orchestrator hub with four specialist agents orbiting it; glowing pulses
 * travel the connection beams (requests out → findings back), echoing the
 * product's core loop. Self-contained, DPR-aware, and fully static under
 * prefers-reduced-motion. Decorative only (aria-hidden, pointer-events-none).
 */

type Agent = { hue: string; mono: string; angle: number; radius: number; speed: number };

const AGENTS: Agent[] = [
  { hue: "#818CF8", mono: "FA", angle: -Math.PI / 2, radius: 0.92, speed: 0.10 }, // forensics · indigo
  { hue: "#A78BFA", mono: "CA", angle: Math.PI * 0.05, radius: 1.0, speed: 0.08 }, // auditor · violet
  { hue: "#22D3EE", mono: "RW", angle: Math.PI * 0.55, radius: 0.86, speed: 0.11 }, // reputation · cyan
  { hue: "#60A5FA", mono: "CM", angle: Math.PI * 1.05, radius: 1.02, speed: 0.09 }, // claims · blue
];

export function SwarmCanvas({ className }: { className?: string }) {
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
    let cx = 0;
    let cy = 0;
    let ring = 0; // base orbit radius in px

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      ring = Math.min(w, h) * 0.34;
    };

    const nodePos = (a: Agent, t: number) => {
      const ang = a.angle + t * a.speed;
      // Slightly elliptical orbit for depth.
      return {
        x: cx + Math.cos(ang) * ring * a.radius * 1.18,
        y: cy + Math.sin(ang) * ring * a.radius * 0.82,
      };
    };

    const glowDot = (x: number, y: number, r: number, color: string, alpha = 1) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // faint concentric orbit rings
      ctx.lineWidth = 1;
      for (const mult of [0.7, 1.0, 1.3]) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, ring * mult * 1.18, ring * mult * 0.82, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const nodes = AGENTS.map((a) => ({ a, ...nodePos(a, t) }));

      // beams hub → agent
      for (const n of nodes) {
        const grad = ctx.createLinearGradient(cx, cy, n.x, n.y);
        grad.addColorStop(0, "rgba(129,140,248,0.35)");
        grad.addColorStop(1, `${n.a.hue}22`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // pulses traveling along beams (two per beam, opposite phases)
      for (const n of nodes) {
        for (let k = 0; k < 2; k++) {
          const phase = (t * 0.45 + k * 0.5 + n.a.angle) % 1;
          const p = k === 0 ? phase : 1 - phase; // out and back
          const px = cx + (n.x - cx) * p;
          const py = cy + (n.y - cy) * p;
          const fade = Math.sin(p * Math.PI); // dim at endpoints
          glowDot(px, py, 1.8, k === 0 ? "#67E8F9" : n.a.hue, 0.9 * fade);
        }
      }

      // agent nodes
      for (const n of nodes) {
        glowDot(n.x, n.y, 4.5, n.a.hue, 0.95);
        // ring
        ctx.strokeStyle = `${n.a.hue}66`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        // monogram
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.font = "600 9px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.a.mono, n.x, n.y + 0.5);
      }

      // orchestrator hub — pulsing core
      const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6);
      ctx.strokeStyle = "rgba(167,139,250,0.5)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      glowDot(cx, cy, 8, "#A5B4FC", 1);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", cx, cy + 0.5);
    };

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.016;
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) draw(0.6);
    else raf = requestAnimationFrame(tick);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduce) draw(0.6);
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
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none h-full w-full ${className ?? ""}`}
    />
  );
}
