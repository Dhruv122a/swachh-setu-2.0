import { WARDS, ROADS, RIVER, LANDMARKS, project } from "../data/wards";
import { CATEGORIES } from "../data/constants";

const Marker = ({ c, selected, onSelect }) => {
  const { x, y } = project(c.latitude, c.longitude);
  const cat = CATEGORIES[c.category] || CATEGORIES.garbage;
  const Icon = cat.icon;
  const urgent = c.priority >= 85 && c.status !== "RESOLVED";
  return (
    <g data-testid={`map-marker-${c.ticketId}`} onClick={() => onSelect?.(c)} className="cursor-pointer" style={{ opacity: c.status === "RESOLVED" ? 0.45 : 1 }}>
      {urgent && <circle cx={x} cy={y} r="10" fill="none" stroke={cat.color} strokeWidth="2" className="marker-pulse" />}
      <circle cx={x} cy={y} r={selected ? 15 : 12} fill="#0B1222" stroke={selected ? "#fff" : cat.color} strokeWidth={selected ? 3 : 2} />
      <Icon x={x - 6.5} y={y - 6.5} width={13} height={13} color={cat.color} strokeWidth={2.4} />
    </g>
  );
};

export const CivicMap = ({ complaints = [], selectedId, onSelect, heatmap, highlightWard, hotWards = [], className = "" }) => (
  <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-[#0A1120] ${className}`} data-testid="civic-map">
    <svg viewBox="0 0 1000 700" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mock civic map of Indore wards">
      <defs>
        <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.6" />
        </pattern>
        <radialGradient id="heat">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#mapgrid)" />
      {WARDS.map((w) => {
        const hot = hotWards.includes(w.ward);
        const active = highlightWard === w.ward;
        return (
          <polygon key={w.ward} points={w.points} data-testid={`map-ward-${w.ward}`}
            fill={hot ? "rgba(239,68,68,0.10)" : active ? "rgba(6,182,212,0.10)" : "rgba(30,41,59,0.35)"}
            stroke={hot ? "#EF4444" : active ? "#06B6D4" : "#334155"} strokeWidth={hot || active ? 2.5 : 1.2} strokeDasharray={hot ? "8 4" : undefined}
            className={hot ? "animate-dash" : ""} />
        );
      })}
      <path d={RIVER} fill="none" stroke="#0E7490" strokeWidth="9" strokeOpacity="0.45" strokeLinecap="round" />
      {ROADS.map((r, i) => <path key={i} d={r.d} fill="none" stroke="#475569" strokeOpacity="0.55" strokeWidth={r.w} strokeLinecap="round" />)}
      <rect x="305" y="400" width="50" height="34" rx="6" fill="#065F46" fillOpacity="0.35" stroke="#10B981" strokeOpacity="0.4" />
      {LANDMARKS.map((l) => <text key={l.label} x={l.x} y={l.y} fill="#64748B" fontSize="13" fontFamily="DM Sans">{l.label}</text>)}
      {WARDS.map((w) => (
        <g key={`l${w.ward}`}>
          <text x={w.label[0]} y={w.label[1]} fill="#E2E8F0" fontSize="20" fontWeight="800" fontFamily="Cabinet Grotesk, sans-serif">{`WARD ${w.ward}`}</text>
          <text x={w.label[0]} y={w.label[1] + 18} fill="#94A3B8" fontSize="13" fontFamily="JetBrains Mono, monospace">{w.name}</text>
        </g>
      ))}
      {heatmap && complaints.filter((c) => c.status !== "RESOLVED").map((c) => {
        const { x, y } = project(c.latitude, c.longitude);
        return <circle key={`h${c.ticketId}`} cx={x} cy={y} r={c.priority * 0.9} fill="url(#heat)" style={{ mixBlendMode: "screen" }} />;
      })}
      {complaints.map((c) => <Marker key={c.ticketId} c={c} selected={selectedId === c.ticketId} onSelect={onSelect} />)}
    </svg>
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-slate-800 bg-slate-950/85 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
      Mock map · Indore (illustrative)
    </div>
  </div>
);
