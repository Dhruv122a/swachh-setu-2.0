import { Timer, AlertTriangle } from "lucide-react";
import { useCountdown } from "../hooks/useCountdown";

export const SlaTimer = ({ due, resolved, seconds, large, testId }) => {
  const { diff, breached, text } = useCountdown(due, seconds);
  if (resolved) return <span data-testid={testId} className="font-mono text-sm text-emerald-300">Closed</span>;
  const risk = !breached && diff < 60 * 60 * 1000;
  const cls = breached ? "text-red-300" : risk ? "text-amber-300" : "text-slate-200";
  const Icon = breached ? AlertTriangle : Timer;
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 whitespace-nowrap font-mono ${large ? "text-3xl font-bold sm:text-4xl" : "text-sm"} ${cls}`}>
      <Icon className={large ? "h-7 w-7" : "h-3.5 w-3.5"} />
      {breached ? `-${text}` : text}
      {breached && !large && <span className="text-[10px] uppercase">breached</span>}
    </span>
  );
};
