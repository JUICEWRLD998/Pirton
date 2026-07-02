import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { Orchestrator, InsufficientFundsError, type HireProgress } from '@pirton/agent-core';
import {
  buildTrustReceipt,
  classifyInput,
  optionalEnv,
  SERVICE_ID_ENV,
  type ReceiptEntry,
} from '@pirton/shared';

/**
 * Live-mode SSE bridge for the Pirton web console.
 *
 *   GET /scan?input=<address or text>  →  text/event-stream
 *
 * Emits the SAME event contract the web app's demo generator does
 * (apps/web/lib/types.ts): classified → progress* → delivered* → receipt.
 * The Next.js route proxies here when ORCH_URL is set and mode=live, so the UI
 * is identical whether the run is scripted or a real on-chain settlement.
 *
 *   npm run orchestrate:serve        (defaults to :8787)
 */
const PORT = Number(optionalEnv('ORCH_PORT') || '8787');

function sse(res: ServerResponse) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'access-control-allow-origin': '*',
  });
  return (event: unknown) => res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function handleScan(req: IncomingMessage, res: ServerResponse, input: string) {
  const send = sse(res);
  try {
    const classification = await classifyInput(input);
    const routed = classification.hire
      .map((s) => ({ specialist: s, serviceId: optionalEnv(SERVICE_ID_ENV[s]) }))
      .filter((r) => r.serviceId !== '');

    send({
      type: 'classified',
      kind: classification.kind,
      subject: classification.address ?? input,
      reason: classification.reason,
      hire: routed.map((r) => r.specialist),
      mode: 'live',
    });

    if (routed.length === 0) {
      send({ type: 'error', message: 'No specialists have a configured CROO_SERVICE_ID_* yet.' });
      return res.end();
    }

    const requirements = {
      subject: classification.address ?? input,
      address: classification.address,
      kind: classification.kind,
      raw: input,
    };

    const orch = await Orchestrator.create({
      onProgress: (p: HireProgress) =>
        send({
          type: 'progress',
          specialist: p.specialist,
          stage: p.stage,
          serviceId: p.serviceId,
          orderId: p.orderId,
          negotiationId: p.negotiationId,
          providerAgentId: p.providerAgentId,
          payTxHash: p.payTxHash,
        }),
    });

    const entries: ReceiptEntry[] = [];
    try {
      const settled = await Promise.allSettled(
        routed.map((r) =>
          orch.hire({ specialist: r.specialist, serviceId: r.serviceId, requirements })
        )
      );
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          entries.push(s.value);
          send({ type: 'delivered', specialist: s.value.specialist, entry: s.value });
        } else if (s.reason instanceof InsufficientFundsError) {
          send({ type: 'error', message: s.reason.message });
        }
      }
    } finally {
      orch.close();
    }

    if (entries.length === 0) {
      send({ type: 'error', message: 'No specialists delivered — cannot build a Trust Receipt.' });
      return res.end();
    }

    const receipt = await buildTrustReceipt({
      subject: classification.address ?? input.slice(0, 80),
      inputKind: classification.kind,
      entries,
      createdAt: new Date().toISOString(),
      signerPrivateKey: optionalEnv('RECEIPT_SIGNER_KEY') || undefined,
    });
    send({ type: 'receipt', receipt });
  } catch (err: any) {
    send({ type: 'error', message: err?.message ?? String(err) });
  } finally {
    res.end();
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname === '/health') {
    res.writeHead(200).end('ok');
    return;
  }
  if (url.pathname === '/scan') {
    const input = (url.searchParams.get('input') ?? '').trim();
    if (!input) {
      res.writeHead(400).end('Missing ?input');
      return;
    }
    void handleScan(req, res, input);
    return;
  }
  res.writeHead(404).end('not found');
}).listen(PORT, () => {
  console.log(`[orchestrator] SSE bridge listening on http://localhost:${PORT}/scan`);
});
