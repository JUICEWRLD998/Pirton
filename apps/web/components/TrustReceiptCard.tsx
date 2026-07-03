"use client";

import { ArrowUpRight } from "lucide-react";
import type { TrustReceipt } from "@/lib/types";
import { SPECIALISTS } from "@/lib/agents";
import { formatUsdc, txUrl, shortHash, shortAddr, addressUrl } from "@/lib/format";

/**
 * The Trust Receipt — a signed "bill of materials" for the trust judgment.
 * Desktop: a clean table. Mobile: per-agent stacked mini-rows.
 */
export function TrustReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  return (
    <div className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Trust Receipt</h3>
          <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            v{receipt.version}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(receipt.createdAt).toLocaleDateString()}
        </span>
      </header>

      {/* meta */}
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        <Meta label="Subject" value={truncate(receipt.subject, 16)} mono />
        <Meta label="Input" value={receipt.inputKind.replace(/_/g, " ")} />
        <Meta label="Agents hired" value={String(receipt.entries.length)} />
        <Meta label="Total paid" value={`${formatUsdc(receipt.totalPaidBaseUnits)} USDC`} accent />
      </div>

      {/* line items — table on desktop */}
      <div className="hidden px-5 py-1 sm:block">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500">
              <th className="py-2.5 text-left font-medium">Agent</th>
              <th className="py-2.5 text-left font-medium">DID</th>
              <th className="py-2.5 text-center font-medium">Reputation</th>
              <th className="py-2.5 text-right font-medium">USDC</th>
              <th className="py-2.5 text-right font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {receipt.entries.map((e) => {
              const meta = SPECIALISTS[e.specialist];
              const addr = e.providerAgentId.replace("did:croo:", "");
              return (
                <tr key={e.specialist} className="border-t border-line-soft">
                  <td className="py-3 text-slate-200">{meta.name}</td>
                  <td className="py-3">
                    <a href={addressUrl(addr)} target="_blank" rel="noreferrer" className="mono text-slate-400 hover:text-brand-300">
                      {shortAddr(addr)}
                    </a>
                  </td>
                  <td className="py-3 text-center mono text-slate-300" title={e.reputation.basis}>
                    {e.reputation.weight.toFixed(2)}
                    <span className="text-slate-600"> · {e.reputation.completedOrders}✓</span>
                  </td>
                  <td className="py-3 text-right mono text-slate-200">
                    {formatUsdc(e.settlement.priceBaseUnits)}
                  </td>
                  <td className="py-3 text-right">
                    {e.settlement.payTxHash ? (
                      <a href={txUrl(e.settlement.payTxHash)} target="_blank" rel="noreferrer" className="inline-flex text-brand-300 hover:text-white" title={e.settlement.payTxHash}>
                        <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* line items — stacked cards on mobile */}
      <div className="divide-y divide-line-soft sm:hidden">
        {receipt.entries.map((e) => {
          const meta = SPECIALISTS[e.specialist];
          const addr = e.providerAgentId.replace("did:croo:", "");
          return (
            <div key={e.specialist} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-200">{meta.name}</span>
                <span className="mono text-[13px] text-slate-200">
                  {formatUsdc(e.settlement.priceBaseUnits)} USDC
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <a href={addressUrl(addr)} target="_blank" rel="noreferrer" className="mono hover:text-brand-300">
                  {shortAddr(addr)}
                </a>
                <span className="mono">
                  rep {e.reputation.weight.toFixed(2)} · {e.reputation.completedOrders}✓
                </span>
                {e.settlement.payTxHash && (
                  <a href={txUrl(e.settlement.payTxHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand-300 hover:text-white">
                    tx <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* provenance */}
      <div className="space-y-1.5 border-t border-line bg-black/20 px-5 py-4 font-mono text-[11px]">
        <Prov label="receiptHash" value={receipt.receiptHash} />
        {receipt.signature && (
          <Prov label="signer" value={receipt.signature.signer} link={addressUrl(receipt.signature.signer)} />
        )}
        <p className="pt-1 font-sans text-[11px] text-slate-500">
          Every judgment is auditable · every honest agent got paid on Base.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="bg-bg-raised/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className={`mt-0.5 text-[13px] ${mono ? "font-mono" : "capitalize"} ${
          accent ? "font-semibold text-brand-300" : "text-slate-200"
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
        <a href={link} target="_blank" rel="noreferrer" className="truncate text-slate-400 hover:text-brand-300">
          {shortHash(value, 16, 10)}
        </a>
      ) : (
        <span className="truncate text-slate-400">{shortHash(value, 16, 10)}</span>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
