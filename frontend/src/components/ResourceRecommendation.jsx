import { Truck } from "lucide-react";
import { fmtDateTime, pct } from "../data/constants";

export const ResourceRecommendation = ({ rec }) => {
  if (!rec) return null;
  return (
    <div data-testid="resource-recommendation" className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">AI Resource Recommendation</p>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">AI Recommendation — Prototype</span>
      </div>
      <div className="mt-4 flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300"><Truck className="h-6 w-6" /></span>
        <p className="font-display text-xl font-bold leading-snug text-white sm:text-2xl" data-testid="resource-recommendation-text">{rec.recommendation}</p>
      </div>
      <div className="mt-5 grid gap-4 border-t border-slate-800 pt-4 sm:grid-cols-3">
        <div className="sm:col-span-2"><p className="eyebrow">Reason</p><p className="mt-1 text-sm text-slate-300">{rec.reason}</p></div>
        <div className="flex gap-6 sm:block">
          <div><p className="eyebrow">Confidence</p><p className="font-mono text-xl font-bold text-cyan-300" data-testid="resource-confidence">{pct(rec.confidence)}</p></div>
          <div className="sm:mt-2"><p className="eyebrow">Timestamp</p><p className="font-mono text-xs text-slate-400">{fmtDateTime(rec.timestamp)}</p></div>
        </div>
      </div>
    </div>
  );
};
