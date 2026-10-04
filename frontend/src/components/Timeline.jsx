import { Check } from "lucide-react";

// steps: [{ label, state: "done" | "current" | "todo", time? }]
export const Timeline = ({ steps, testId = "timeline" }) => (
  <ol data-testid={testId} className="relative space-y-0">
    {steps.map((s, i) => (
      <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0" data-testid={`${testId}-step-${i}`}>
        {i < steps.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-px ${s.state === "done" ? "bg-emerald-500/60" : "bg-slate-700"}`} />}
        <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${s.state === "done" ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : s.state === "current" ? "border-cyan-400 bg-cyan-500/20" : "border-slate-700 bg-slate-900"}`}>
          {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : s.state === "current" ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" /> : <span className="h-2 w-2 rounded-full bg-slate-700" />}
        </span>
        <div className="pt-0.5">
          <p className={`text-sm font-semibold ${s.state === "todo" ? "text-slate-500" : "text-white"}`}>{s.label}</p>
          {s.time && <p className="font-mono text-[11px] text-slate-500">{s.time}</p>}
          {s.state === "current" && <p className="font-mono text-[11px] uppercase tracking-widest text-cyan-300">Current stage</p>}
        </div>
      </li>
    ))}
  </ol>
);
