import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { PageHeader, Section } from "../components/Layout";
import { ChartCard, chartTooltip, axisProps } from "../components/ChartCard";
import { ResourceRecommendation } from "../components/ResourceRecommendation";
import { RealCivicMap } from "../components/RealCivicMap";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { AiTag } from "../components/Badges";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { CATEGORIES } from "../data/constants";

export const TrendCard = ({ t, i = 0 }) => {
  const Icon = CATEGORIES[t.category].icon;
  return (
    <div className="panel p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }} data-testid={`trend-ward-${t.ward}`}>
      <p className="eyebrow">Ward {t.ward} · {t.wardName}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="flex items-center gap-2 font-display text-xl font-bold text-white"><Icon className="h-5 w-5" style={{ color: CATEGORIES[t.category].color }} />{CATEGORIES[t.category].full}</p>
        <p className="flex items-center gap-1 font-mono text-2xl font-bold text-red-300"><TrendingUp className="h-5 w-5" />{t.change}%</p>
      </div>
      <p className="mt-1 font-mono text-xs text-slate-500">{t.previous} → {t.current} reports week-on-week</p>
    </div>
  );
};

const LEVEL = { HOTSPOT: "text-red-300 border-red-500/50 bg-red-500/10", WATCH: "text-amber-300 border-amber-500/40 bg-amber-500/10", NORMAL: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" };

export default function Hotspots() {
  const { data: h, loading, error, reload } = useApi(() => api.hotspots(), []);
  const { data: complaints } = useApi(() => api.listComplaints(), []);
  if (loading) return <LoadingState label="Insight Agent computing hotspots…" />;
  if (error) return <ErrorState title="Insights unavailable" message={error} onRetry={reload} />;
  const hot = h.hotspots.filter((x) => x.level === "HOTSPOT").map((x) => x.ward);

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader eyebrow="Civic Hotspot Intelligence" title="The city, learning." subtitle="Insight Agent turns every report into ward-level trends and resource recommendations." actions={<AiTag>Insight Agent</AiTag>} />
      <div className="grid gap-4 md:grid-cols-3">{h.trends.slice(0, 3).map((t, i) => <TrendCard key={`${t.ward}${t.category}`} t={t} i={i} />)}</div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7"><ResourceRecommendation rec={h.recommendation} /></div>
        <Section title="Ward risk ranking" className="lg:col-span-5" testId="ward-ranking">
          <ul className="space-y-2.5">
            {h.hotspots.map((w) => (
              <li key={w.ward} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-semibold text-white">Ward {w.ward}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${w.risk}%` }} /></div>
                <span className={`w-20 rounded-md border px-1.5 py-0.5 text-center font-mono text-[10px] ${LEVEL[w.level]}`}>{w.level}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Section title="Hotspot map" className="lg:col-span-5"><RealCivicMap complaints={complaints || []} heatmap hotWards={hot} className="aspect-[4/5] w-full sm:aspect-[10/7]" /></Section>
        <ChartCard title="Daily complaint volume" subtitle="Last 14 days" className="lg:col-span-7" testId="chart-daily">
          <ResponsiveContainer><AreaChart data={h.daily}>
            <defs><linearGradient id="vol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} /><stop offset="100%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="#1E293B" vertical={false} /><XAxis dataKey="date" {...axisProps} /><YAxis {...axisProps} width={30} /><Tooltip {...chartTooltip} />
            <Area type="monotone" dataKey="complaints" stroke="#06B6D4" strokeWidth={2} fill="url(#vol)" />
          </AreaChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ChartCard title="By category" testId="chart-category">
          <ResponsiveContainer><BarChart data={h.byCategory} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" {...axisProps} /><YAxis type="category" dataKey="category" {...axisProps} width={110} /><Tooltip {...chartTooltip} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>{h.byCategory.map((d) => <Cell key={d.key} fill={CATEGORIES[d.key].color} />)}</Bar>
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="By ward" testId="chart-ward">
          <ResponsiveContainer><BarChart data={h.byWard}>
            <CartesianGrid stroke="#1E293B" vertical={false} /><XAxis dataKey="ward" {...axisProps} /><YAxis {...axisProps} width={30} /><Tooltip {...chartTooltip} />
            <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Avg resolution time" subtitle="Hours" testId="chart-resolution">
          <ResponsiveContainer><BarChart data={h.resolutionTime} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" {...axisProps} /><YAxis type="category" dataKey="category" {...axisProps} width={110} /><Tooltip {...chartTooltip} />
            <Bar dataKey="hours" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="SLA breach rate" subtitle="% by ward" testId="chart-sla">
          <ResponsiveContainer><LineChart data={h.slaBreachRate}>
            <CartesianGrid stroke="#1E293B" vertical={false} /><XAxis dataKey="ward" {...axisProps} /><YAxis {...axisProps} width={30} unit="%" /><Tooltip {...chartTooltip} />
            <Line type="monotone" dataKey="rate" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 4 }} />
          </LineChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
