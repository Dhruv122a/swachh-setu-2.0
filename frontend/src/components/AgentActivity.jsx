import { Check, Loader2 } from "lucide-react";
import { AiTag } from "./Badges";
import { fmtTime, pct } from "../data/constants";

// Reusable card that shows one agent's recommendation with confidence, reason and timestamp.
export const AgentActivity = ({ name, icon: Icon, status = "done", confidence, reason, timestamp, children, testId, accent = "#06B6D4" }) => (
  <div data-testid={testId} className={`panel relative overflow-hidden p-5 ${status === "idle" ? "opacity-40" : "animate-fade-up"}`}>
    {status === "running" && <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="animate-scan h-1/2 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent" /></div>}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10" style={{ background: `${accent}1a`, color: accent }}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-base font-bold text-white">{name}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {status === "done" ? `Completed · ${fmtTime(timestamp)}` : status === "running" ? "Reasoning…" : "Waiting"}
          </p>
        </div>
      </div>
      {status === "done" ? <Check className="h-5 w-5 text-emerald-400" /> : status === "running" ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : null}
    </div>
    {status === "done" && (
      <div className="mt-4 space-y-4">
        {children}
        {(reason || confidence != null) && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <AiTag />
              {confidence != null && <span className="font-mono text-xs text-cyan-300">Confidence {pct(confidence)}</span>}
            </div>
            {reason && <p className="text-sm leading-relaxed text-slate-300">{reason}</p>}
          </div>
        )}
      </div>
    )}
  </div>
);

export const KV = ({ label, value, mono }) => (
  <div>
    <p className="eyebrow">{label}</p>
    <div className={`mt-1 text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>
);
