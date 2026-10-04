import { Badge } from "./Badges";

const tone = (p) => (p >= 90 ? "text-red-300 border-red-500/50 bg-red-500/10" : p >= 75 ? "text-orange-300 border-orange-500/50 bg-orange-500/10" : p >= 50 ? "text-amber-200 border-amber-500/40 bg-amber-500/10" : "text-slate-300 border-slate-600 bg-slate-700/30");

export const PriorityBadge = ({ priority, severity, testId }) => (
  <span className="inline-flex items-center gap-2" data-testid={testId}>
    <span className={`inline-flex items-baseline gap-1 rounded-md border px-2 py-0.5 font-mono text-sm font-bold ${tone(priority)}`}>
      {priority}
      <span className="text-[10px] font-normal opacity-70">/100</span>
    </span>
    {severity && <Badge kind="severity" value={severity} />}
  </span>
);
