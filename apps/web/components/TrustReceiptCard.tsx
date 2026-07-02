"use client";

import { motion } from "framer-motion";
import type { TrustReceipt } from "@/lib/types";
import { SPECIALISTS } from "@/lib/agents";
import { formatUsdc, txUrl, shortHash, shortAddr, addressUrl } from "@/lib/format";
import { spring } from "@/lib/motion";

/**
 * The Trust Receipt — a signed, hash-anchored "bill of materials" for the trust
 * judgment. Per hired agent: DID, finding count, USDC earned, reputation, pay
 * tx. Plus the receipt hash + signature. This is the money-shot artifact.
 */
export function TrustReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.15 }}
      className="glass relative overflow-hidden rounded-xl3 p-5 sm:p-6"
    >
      {/* perforated top edge for the "receipt" feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2h9l5 5v13a1 1 0 0 1-1.4.9L16 20l-2 1-2-1-2 1-2-1-2.6 1.9A1 1 0 0 1 2 21V4a2 2 0 0 1 2-2z"
              stroke="rgb(var(--accent))"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Trust Receipt
          </h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            v{receipt.version}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(receipt.createdAt).toLocaleString()}
        </span>
      </header>

      {/* meta grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Subject" value={truncate(receipt.subject, 20)} mono />
        <Meta label="Input" value={receipt.inputKind.replace(/_/g, " ")} />
        <Meta label="Agents hired" value={String(receipt.entries.length)} />
        <Meta
          label="Total paid"
          value={`${formatUsdc(receipt.totalPaidBaseUnits)} USDC`}
          accent
        />
      </div>

      {/* line items */}
      <div className="mt-5 overflow-hidden rounded-xl border border-white/8">
        <div className="grid grid-cols-12 gap-2 border-b border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          <div className="col-span-4">Agent</div>
          <div className="col-span-3">DID</div>
          <div className="col-span-2 text-center">Rep</div>
          <div className="col-span-2 text-right">USDC</div>
          <div className="col-span-1 text-right">Tx</div>
        </div>
        {receipt.entries.map((e, i) => {
          const meta = SPECIALISTS[e.specialist];
          return (
            <motion.div
              key={e.specialist}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="grid grid-cols-12 items-center gap-2 border-b border-white/[0.04] px-3 py-2.5 text-[12px] last:border-0"
            >
              <div className="col-span-4 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: meta.hue }}
                />
                <span className="truncate text-slate-200">{meta.name}</span>
              </div>
              <div className="col-span-3">
                <a
                  href={addressUrl(e.providerAgentId.replace("did:croo:", ""))}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-slate-400 hover:text-cyan-glow"
                >
                  {shortAddr(e.providerAgentId.replace("did:croo:", ""))}
                </a>
              </div>
              <div
                className="col-span-2 text-center mono"
                title={e.reputation.basis}
              >
                <span className="text-slate-300">{e.reputation.weight.toFixed(2)}</span>
                <span className="text-slate-600"> · {e.reputation.completedOrders}✓</span>
              </div>
              <div className="col-span-2 text-right mono text-safe-soft">
                {formatUsdc(e.settlement.priceBaseUnits)}
              </div>
              <div className="col-span-1 text-right">
                {e.settlement.payTxHash ? (
                  <a
                    href={txUrl(e.settlement.payTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-glow hover:text-white"
                    title={e.settlement.payTxHash}
                  >
                    ↗
                  </a>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* provenance footer */}
      <div className="mt-4 space-y-1.5 rounded-lg border border-dashed border-white/12 bg-black/20 p-3 font-mono text-[11px]">
        <Prov label="receiptHash" value={receipt.receiptHash} />
        {receipt.signature && (
          <>
            <Prov label="signer" value={receipt.signature.signer} link={addressUrl(receipt.signature.signer)} />
            <Prov label="signature" value={receipt.signature.value} />
          </>
        )}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-slate-500">
        Every judgment is auditable · every honest agent got paid on Base.
      </p>
    </motion.div>
  );
}

function Meta({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className={`mt-0.5 text-[13px] ${mono ? "font-mono" : "capitalize"} ${
          accent ? "font-semibold text-safe-soft" : "text-slate-200"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Prov({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-slate-600">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="truncate text-slate-400 hover:text-cyan-glow">
          {shortHash(value, 18, 12)}
        </a>
      ) : (
        <span className="truncate text-slate-400">{shortHash(value, 18, 12)}</span>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
