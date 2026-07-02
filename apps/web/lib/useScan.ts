"use client";

import { useCallback, useReducer, useRef } from "react";
import type {
  HireStage,
  ReceiptEntry,
  ScanEvent,
  SpecialistId,
  TrustReceipt,
  ClassifiedEvent,
} from "./types";

export interface AgentState {
  specialist: SpecialistId;
  stage: HireStage;
  providerAgentId?: string;
  priceBaseUnits?: string;
  payTxHash?: string;
  orderId?: string;
  entry?: ReceiptEntry;
}

export type ScanPhase = "idle" | "classifying" | "hiring" | "done" | "error";

export interface ScanState {
  phase: ScanPhase;
  input: string;
  classification: ClassifiedEvent | null;
  agents: AgentState[];
  receipt: TrustReceipt | null;
  notice?: string;
  error?: string;
}

const initial: ScanState = {
  phase: "idle",
  input: "",
  classification: null,
  agents: [],
  receipt: null,
};

type Action =
  | { t: "start"; input: string }
  | { t: "event"; ev: ScanEvent }
  | { t: "reset" }
  | { t: "fail"; message: string };

function reducer(state: ScanState, action: Action): ScanState {
  switch (action.t) {
    case "start":
      return { ...initial, phase: "classifying", input: action.input };
    case "reset":
      return initial;
    case "fail":
      return { ...state, phase: "error", error: action.message };
    case "event": {
      const ev = action.ev;
      switch (ev.type) {
        case "classified": {
          // Seed an agent slot per hired specialist so the board can pre-render.
          const agents: AgentState[] = ev.hire.map((s) => ({
            specialist: s,
            stage: "negotiating",
          }));
          return { ...state, phase: "hiring", classification: ev, agents };
        }
        case "progress": {
          const agents = upsertAgent(state.agents, ev.specialist, (a) => ({
            ...a,
            stage: ev.stage,
            providerAgentId: ev.providerAgentId ?? a.providerAgentId,
            priceBaseUnits: ev.priceBaseUnits ?? a.priceBaseUnits,
            payTxHash: ev.payTxHash ?? a.payTxHash,
            orderId: ev.orderId ?? a.orderId,
          }));
          return { ...state, agents };
        }
        case "delivered": {
          const agents = upsertAgent(state.agents, ev.specialist, (a) => ({
            ...a,
            stage: "done",
            entry: ev.entry,
            providerAgentId: ev.entry.providerAgentId,
            priceBaseUnits: ev.entry.settlement.priceBaseUnits,
            payTxHash: ev.entry.settlement.payTxHash,
          }));
          return { ...state, agents };
        }
        case "receipt":
          return { ...state, phase: "done", receipt: ev.receipt };
        case "error":
          // A soft notice (e.g. live→demo fallback); not fatal.
          return { ...state, notice: ev.message };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}

function upsertAgent(
  agents: AgentState[],
  specialist: SpecialistId,
  update: (a: AgentState) => AgentState
): AgentState[] {
  const idx = agents.findIndex((a) => a.specialist === specialist);
  if (idx === -1) return [...agents, update({ specialist, stage: "negotiating" })];
  const next = agents.slice();
  next[idx] = update(next[idx]);
  return next;
}

export function useScan() {
  const [state, dispatch] = useReducer(reducer, initial);
  const esRef = useRef<EventSource | null>(null);

  const start = useCallback((input: string, mode: "demo" | "live" = "demo") => {
    esRef.current?.close();
    dispatch({ t: "start", input });

    const url = `/api/scan?input=${encodeURIComponent(input)}&mode=${mode}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data) as ScanEvent;
        dispatch({ t: "event", ev });
        if (ev.type === "receipt") es.close();
      } catch {
        /* ignore keep-alive comments / partials */
      }
    };
    es.onerror = () => {
      // EventSource fires error on normal stream close too; only surface if we
      // never reached a receipt.
      es.close();
    };
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    dispatch({ t: "reset" });
  }, []);

  return { state, start, reset };
}
