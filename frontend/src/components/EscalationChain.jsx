import { Check } from "lucide-react";

export const EscalationChain = ({ chain = [], level = 0, animatingTo }) => (
  <div data-testid="escalation-chain" className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-4">
    {chain.map((step, i) => {
      const done = i < level;
      const current = i === level;
      const pending = animatingTo != null && i === animatingTo;
      return (
        <div key={step} data-testid={`escalation-step-${i}`} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${current ? "border-red-500/70 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.25)]" : done ? "border-emerald-500/40 bg-emerald-500/5" : pending ? "animate-pulse border-amber-400/70 bg-amber-500/10" : "border-slate-800 bg-slate-900/60"}`} style={{ transition: "background-color .4s, border-color .4s, box-shadow .4s" }}>
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] ${current ? "bg-red-500 text-white" : done ? "bg-emerald-500/30 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>
            {done ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className={`text-sm font-semibold ${current ? "text-red-200" : done ? "text-emerald-200" : "text-slate-400"}`}>{step}</span>
          {current && <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-red-300">Now</span>}
        </div>
      );
    })}
  </div>
);
