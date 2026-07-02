import { NextRequest } from "next/server";
import { planDemo, scriptDemo } from "@/lib/demo";
import type { ScanEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/scan?input=...&mode=demo|live
 *
 * Streams Server-Sent Events describing a scan:
 *   event: message
 *   data: { type: "classified" | "progress" | "delivered" | "receipt" | "error", ... }
 *
 * DEMO mode (default): a scripted, realistically-timed run of the flagship
 * scenarios — deterministic, offline, always presentable.
 *
 * LIVE mode: proxies the orchestrator's SSE stream at ORCH_URL (set once CAP
 * service ids + a funded wallet are provisioned). Same event contract, so the
 * UI is unchanged.
 */
export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim() ?? "";
  const mode = req.nextUrl.searchParams.get("mode") ?? "demo";
  const orchUrl = process.env.ORCH_URL;

  if (!input) {
    return new Response("Missing ?input", { status: 400 });
  }

  // Live: transparently proxy the orchestrator's SSE stream.
  if (mode === "live" && orchUrl) {
    try {
      const upstream = await fetch(
        `${orchUrl.replace(/\/$/, "")}/scan?input=${encodeURIComponent(input)}`,
        { headers: { accept: "text/event-stream" } }
      );
      if (!upstream.ok || !upstream.body) {
        throw new Error(`orchestrator responded ${upstream.status}`);
      }
      return new Response(upstream.body, { headers: sseHeaders() });
    } catch (err: unknown) {
      // Fall through to demo so the UI never dead-ends in front of judges.
      const msg = err instanceof Error ? err.message : String(err);
      return demoStream(input, `live orchestrator unavailable (${msg}) — showing demo run`);
    }
  }

  return demoStream(input);
}

function sseHeaders(): HeadersInit {
  return {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  };
}

function demoStream(input: string, notice?: string): Response {
  const plan = planDemo(input);
  const script = scriptDemo(plan);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: ScanEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      };
      if (notice) {
        send({ type: "error", message: notice });
      }
      // Compress the wall-clock a touch so the whole run lands in ~9-11s.
      const speed = 0.85;
      let prev = 0;
      for (const step of script) {
        const wait = Math.max(0, (step.delay - prev) * speed);
        prev = step.delay;
        await sleep(wait);
        send(step.event);
      }
      // Signal completion with a comment; the client closes on `receipt`.
      controller.enqueue(encoder.encode(`: done\n\n`));
      controller.close();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
