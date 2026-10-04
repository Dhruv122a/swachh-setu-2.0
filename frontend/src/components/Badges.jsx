import { STATUS, SEVERITY, CATEGORIES } from "../data/constants";

export const Badge = ({ kind, value, testId }) => {
  if (kind === "status") {
    const s = STATUS[value] || STATUS.SUBMITTED;
    return (
      <span data-testid={testId} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${s.cls}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {s.label}
      </span>
    );
  }
  return (
    <span data-testid={testId} className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${SEVERITY[value] || SEVERITY.low}`}>
      {value}
    </span>
  );
};

export const CategoryChip = ({ category, label }) => {
  const c = CATEGORIES[category] || CATEGORIES.garbage;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-100">
      <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10" style={{ background: `${c.color}1f`, color: c.color }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      {label || c.full}
    </span>
  );
};

export const AiTag = ({ children = "AI Recommendation" }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-300">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" /> {children}
  </span>
);

export const OfficerTag = ({ children = "Officer Decision" }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
    {children}
  </span>
);
