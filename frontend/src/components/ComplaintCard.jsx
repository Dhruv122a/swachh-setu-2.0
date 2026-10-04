import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { CategoryChip } from "./Badges";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SlaTimer } from "./SlaTimer";

export const ComplaintCard = ({ c, rank, onClick }) => (
  <button type="button" onClick={() => onClick?.(c)} data-testid={`complaint-card-${c.ticketId}`} className="panel block w-full p-4 text-left hover:border-cyan-500/50 active:scale-[0.99]" style={{ transition: "border-color .2s, transform .1s" }}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <p className="font-mono text-[11px] text-slate-500">{rank ? `#${rank} · ` : ""}{c.ticketId}</p>
        <CategoryChip category={c.category} label={c.categoryLabel} />
        <p className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> Ward {c.ward} · {c.location}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
      <PriorityBadge priority={c.priority} />
      <StatusBadge status={c.status} />
      <SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} />
    </div>
  </button>
);

export const ComplaintLink = ({ id, children }) => (
  <Link to={`/complaints/${id}`} className="font-mono text-cyan-300 hover:underline">{children || id}</Link>
);
