import { CategoryChip } from "./Badges";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SlaTimer } from "./SlaTimer";

export const ComplaintTable = ({ items, onSelect, selectedId }) => (
  <div className="overflow-x-auto scrollbar-thin">
    <table className="w-full min-w-[820px] text-left" data-testid="complaint-table">
      <thead>
        <tr className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {["#", "Ticket", "Category", "Ward", "AI Priority", "Status", "SLA", "Team"].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {items.map((c, i) => (
          <tr key={c.ticketId} onClick={() => onSelect?.(c)} data-testid={`queue-row-${c.ticketId}`}
            className={`cursor-pointer border-b border-slate-800/70 hover:bg-slate-800/50 ${selectedId === c.ticketId ? "bg-cyan-500/5" : ""}`} style={{ transition: "background-color .15s" }}>
            <td className="px-3 py-3 font-mono text-sm text-slate-500">{i + 1}</td>
            <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-300">{c.ticketId}</td>
            <td className="px-3 py-3"><CategoryChip category={c.category} label={c.categoryLabel} /></td>
            <td className="px-3 py-3 text-sm text-slate-300">Ward {c.ward}</td>
            <td className="px-3 py-3"><PriorityBadge priority={c.priority} /></td>
            <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
            <td className="px-3 py-3"><SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} /></td>
            <td className="max-w-[180px] truncate px-3 py-3 text-xs text-slate-400">{c.status === "SUBMITTED" ? <span className="text-amber-300">Unassigned</span> : c.team}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
