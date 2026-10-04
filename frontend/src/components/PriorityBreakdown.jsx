export const PriorityBreakdown = ({ factors = [], total }) => (
  <div data-testid="priority-breakdown" className="font-mono text-sm">
    {factors.map((f, i) => (
      <div key={f.label} className="flex items-center gap-3 py-1.5 animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
        <span className="w-40 shrink-0 text-slate-300">{f.label}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" style={{ width: `${(f.points / 30) * 100}%` }} />
        </div>
        <span className="w-10 text-right font-semibold text-cyan-300">+{f.points}</span>
      </div>
    ))}
    <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-700 pt-2">
      <span className="text-slate-400">AI priority score</span>
      <span className="text-lg font-bold text-white" data-testid="priority-total">{total}</span>
    </div>
  </div>
);
