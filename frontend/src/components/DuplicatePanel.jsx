import { Link } from "react-router-dom";
import { Copy } from "lucide-react";

export const DuplicatePanel = ({ dup }) => {
  if (!dup) return null;
  if (!dup.count) return <p className="text-sm text-slate-400" data-testid="duplicates-none">No similar complaints within 300 m. Treated as a new civic incident.</p>;
  return (
    <div data-testid="duplicates-panel" className="space-y-3">
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="font-display text-2xl font-extrabold text-white"><Copy className="mr-2 inline h-5 w-5 text-amber-400" />{dup.count} similar complaints detected</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"><p className="eyebrow">Similarity</p><p className="mt-1 text-xl font-bold text-amber-300">{dup.similarity}%</p></div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"><p className="eyebrow">Nearest</p><p className="mt-1 text-xl font-bold text-white">{dup.nearestDistance} m</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {dup.matches.map((m) => (
          <Link key={m.ticketId} to={`/complaints/${m.ticketId}`} data-testid={`dup-link-${m.ticketId}`} className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-200 hover:border-amber-500/60 hover:text-amber-200" style={{ transition: "color .2s, border-color .2s" }}>
            {m.ticketId} · {m.distance}m
          </Link>
        ))}
      </div>
    </div>
  );
};
