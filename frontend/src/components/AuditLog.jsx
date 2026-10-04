import { Bot, User, Cpu, Smartphone } from "lucide-react";
import { fmtTime } from "../data/constants";

const META = {
  ai: { icon: Bot, cls: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10" },
  officer: { icon: User, cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  system: { icon: Cpu, cls: "text-slate-300 border-slate-600 bg-slate-700/30" },
  citizen: { icon: Smartphone, cls: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
};

export const AuditLog = ({ entries = [] }) => (
  <ul data-testid="audit-log" className="space-y-3">
    {[...entries].reverse().map((e, i) => {
      const m = META[e.type] || META.system;
      const Icon = m.icon;
      return (
        <li key={`${e.time}-${i}`} className="flex gap-3" data-testid={`audit-entry-${i}`}>
          <span className="w-12 shrink-0 pt-1 font-mono text-xs text-slate-500">{fmtTime(e.time)}</span>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${m.cls}`}><Icon className="h-3.5 w-3.5" /></span>
          <div className="min-w-0">
            <p className="text-sm text-slate-200">{e.message}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{e.actor} · {e.type === "ai" ? "AI Recommendation" : e.type === "officer" ? "Officer Decision" : e.type}</p>
          </div>
        </li>
      );
    })}
  </ul>
);
