export const ChartCard = ({ title, subtitle, children, testId, className = "" }) => (
  <div data-testid={testId} className={`panel p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
    <div className="h-64 w-full">{children}</div>
  </div>
);

export const chartTooltip = {
  contentStyle: { background: "#0F172A", border: "1px solid #334155", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 },
  labelStyle: { color: "#E2E8F0" },
  cursor: { fill: "rgba(148,163,184,0.08)" },
};
export const axisProps = { stroke: "#64748B", fontSize: 11, tickLine: false, axisLine: false };
