import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, X, ArrowRight } from "lucide-react";
import { PageHeader, Section } from "../components/Layout";
import { RealCivicMap } from "../components/RealCivicMap";
import { CategoryChip } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaTimer } from "../components/SlaTimer";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { Switch } from "../components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { CATEGORIES, STATUS } from "../data/constants";
import { WARDS } from "../data/wards";

const FilterSelect = ({ value, onChange, placeholder, options, testId }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger data-testid={testId} className="h-10 w-full min-w-0 border-slate-700 bg-slate-900/70 sm:w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
      <SelectItem value="all">{placeholder}</SelectItem>
      {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
    </SelectContent>
  </Select>
);

export const MarkerInfo = ({ c, onClose }) => (
  <div className="panel overflow-hidden animate-fade-up" data-testid="marker-info">
    {c.image && <img src={c.image} alt="" className="h-40 w-full object-cover" />}
    <div className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-mono text-xs text-slate-500">{c.ticketId}</p><CategoryChip category={c.category} label={c.categoryLabel} /></div>
        {onClose && <button onClick={onClose} data-testid="marker-info-close" className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}
      </div>
      <p className="text-sm text-slate-300">{c.description}</p>
      <p className="text-xs text-slate-400">Ward {c.ward} · {c.location}</p>
      <div className="flex flex-wrap items-center gap-2"><PriorityBadge priority={c.priority} severity={c.severity} /><StatusBadge status={c.status} /></div>
      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        <SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} />
        <Link to={`/complaints/${c.ticketId}`} data-testid="marker-info-open" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">Details <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  </div>
);

export default function MapPage() {
  const { data, loading, error, reload } = useApi(() => api.listComplaints(), []);
  const [f, setF] = useState({ category: "all", ward: "all", severity: "all", status: "all" });
  const [heat, setHeat] = useState(false);
  const [sel, setSel] = useState(null);
  const items = useMemo(() => (data || []).filter((c) =>
    (f.category === "all" || c.category === f.category) && (f.ward === "all" || c.ward === +f.ward) &&
    (f.severity === "all" || c.severity === f.severity) && (f.status === "all" || c.status === f.status)), [data, f]);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  if (loading) return <LoadingState label="Rendering civic map…" />;
  if (error) return <ErrorState title="Map data unavailable" message={error} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader eyebrow="Civic Map · Indore (mock)" title="Every complaint, on the map." subtitle="Ward boundaries, live complaint markers and a priority heatmap. Click a marker for details." />
      <div className="mb-4 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap" data-testid="map-filters">
        <FilterSelect testId="filter-category" value={f.category} onChange={set("category")} placeholder="All categories" options={Object.entries(CATEGORIES).map(([k, v]) => [k, v.label])} />
        <FilterSelect testId="filter-ward" value={f.ward} onChange={set("ward")} placeholder="All wards" options={WARDS.map((w) => [String(w.ward), `Ward ${w.ward}`]).sort((a, b) => a[0] - b[0])} />
        <FilterSelect testId="filter-priority" value={f.severity} onChange={set("severity")} placeholder="All priorities" options={[["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]]} />
        <FilterSelect testId="filter-status" value={f.status} onChange={set("status")} placeholder="All statuses" options={Object.entries(STATUS).map(([k, v]) => [k, v.label])} />
        <label className="col-span-2 flex items-center justify-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 sm:ml-auto">
          <Flame className={`h-4 w-4 ${heat ? "text-red-400" : ""}`} /> Heatmap <Switch checked={heat} onCheckedChange={setHeat} data-testid="heatmap-toggle" />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
          <RealCivicMap complaints={items} heatmap={heat} selectedId={sel?.ticketId} onSelect={setSel} highlightWard={f.ward !== "all" ? +f.ward : undefined} className="aspect-[4/5] w-full sm:aspect-[10/7]" />
          <div className="mt-3 flex flex-wrap gap-4">
            {Object.entries(CATEGORIES).map(([k, v]) => <span key={k} className="flex items-center gap-1.5 text-xs text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />{v.label}</span>)}
            <span className="font-mono text-xs text-slate-500" data-testid="map-count">{items.length} shown</span>
          </div>
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          {sel ? <MarkerInfo c={sel} onClose={() => setSel(null)} /> : (
            <Section title="Select a marker"><p className="text-sm text-slate-400">Pulsing markers are P1 complaints (priority ≥ 85). Faded markers are resolved.</p></Section>
          )}
        </div>
      </div>
    </div>
  );
}
