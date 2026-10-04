export const MetricCard = ({ label, value, hint, icon: Icon, accent = "#06B6D4", testId, delay = 0 }) => (
  <div data-testid={testId} className="panel group relative overflow-hidden p-5 animate-fade-up hover:border-slate-600" style={{ animationDelay: `${delay}ms`, transition: "border-color .2s" }}>
    <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    <div className="flex items-start justify-between">
      <p className="eyebrow">{label}</p>
      {Icon && <Icon className="h-4 w-4" style={{ color: accent }} />}
    </div>
    <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl" data-testid={testId && `${testId}-value`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);
