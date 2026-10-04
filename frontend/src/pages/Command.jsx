import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Clock, AlertTriangle, CheckCircle2, Siren, Search, ArrowRight, Check } from "lucide-react";
import { PageHeader, Section, Btn } from "../components/Layout";
import { MetricCard } from "../components/MetricCard";
import { RealCivicMap } from "../components/RealCivicMap";
import { ComplaintTable } from "../components/ComplaintTable";
import { ComplaintCard } from "../components/ComplaintCard";
import { Drawer } from "../components/Drawer";
import { CategoryChip, AiTag } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaTimer } from "../components/SlaTimer";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { notify } from "../components/Toast";
import { Input } from "../components/ui/input";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { isBreached, minutesLeft, pct } from "../data/constants";

const FILTERS = {
  All: () => true, Critical: (c) => c.severity === "critical", High: (c) => c.severity === "high", Medium: (c) => c.severity === "medium",
  "SLA Risk": (c) => !isBreached(c) && minutesLeft(c) < 120, "SLA Breached": isBreached, Unassigned: (c) => c.status === "SUBMITTED",
};
const KPIS = [
  ["total", "Total", Inbox, "#38BDF8"], ["pending", "Pending", Clock, "#F59E0B"], ["highPriority", "High Priority", AlertTriangle, "#F97316"],
  ["resolvedToday", "Resolved Today", CheckCircle2, "#10B981"], ["slaBreaches", "SLA Breaches", Siren, "#EF4444"],
];

const QuickView = ({ c, onChange }) => {
  const [busy, setBusy] = useState(false);
  const act = async (fn, msg) => {
    setBusy(true);
    try { onChange(await fn()); notify.success(msg); } catch (e) { notify.error(e.message); }
    setBusy(false);
  };
  return (
    <div className="space-y-5">
      {c.image && <img src={c.image} alt="" className="h-44 w-full rounded-lg object-cover" />}
      <div className="flex flex-wrap items-center gap-2"><CategoryChip category={c.category} label={c.categoryLabel} /><StatusBadge status={c.status} /></div>
      <p className="text-sm text-slate-300">{c.description}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="eyebrow">AI Priority</p><PriorityBadge priority={c.priority} severity={c.severity} /></div>
        <div><p className="eyebrow">SLA</p><SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} /></div>
        <div><p className="eyebrow">Department</p><p className="font-semibold text-white">{c.department}</p></div>
        <div><p className="eyebrow">Team</p><p className="font-semibold text-white">{c.team}</p></div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <div className="mb-1 flex items-center justify-between"><AiTag /><span className="font-mono text-xs text-cyan-300">{pct(c.confidence)}</span></div>
        <p className="text-sm text-slate-300">{c.ai.triage.reason}</p>
        <p className="mt-2 text-xs text-slate-400">Action Agent: {c.ai.action.recommendation}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {c.status === "SUBMITTED" && <Btn disabled={busy} data-testid="drawer-assign-btn" onClick={() => act(() => api.setStatus(c.ticketId, "ASSIGNED", `Assigned to ${c.team}`), "Team assigned")}><Check className="h-4 w-4" /> Assign {c.team.split(" ").slice(2).join(" ")}</Btn>}
        {["ASSIGNED", "INSPECTION_SCHEDULED"].includes(c.status) && <Btn disabled={busy} data-testid="drawer-progress-btn" onClick={() => act(() => api.setStatus(c.ticketId, "IN_PROGRESS"), "Marked In Progress")}>Mark In Progress</Btn>}
        <Link to={`/complaints/${c.ticketId}`} data-testid="drawer-open-detail"><Btn variant="ghost">Full detail & override <ArrowRight className="h-4 w-4" /></Btn></Link>
      </div>
    </div>
  );
};

export default function Command() {
  const { data, loading, error, reload, setData } = useApi(() => api.dashboard(), []);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const seen = useRef(null);
  useEffect(() => { const t = setInterval(() => reload(true), 10000); return () => clearInterval(t); }, [reload]);
  useEffect(() => {
    if (!data?.inbox) return;
    if (seen.current) {
      data.inbox.filter((c) => !seen.current.has(c.ticketId)).forEach((c) =>
        notify.info(`New citizen report: ${c.categoryLabel} · Ward ${c.ward}`, { description: `${c.ticketId} · AI priority ${c.priority}` }));
    }
    seen.current = new Set(data.inbox.map((c) => c.ticketId));
  }, [data]);

  const queue = useMemo(() => (data?.queue || []).filter(FILTERS[filter]).filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.ticketId.toLowerCase().includes(s) || c.categoryLabel.toLowerCase().includes(s) || `ward ${c.ward}`.includes(s) || String(c.ward) === s;
  }), [data, filter, q]);

  if (loading) return <LoadingState label="Booting command center…" />;
  if (error) return <ErrorState title="Command Center offline" message={`${error}. The backend may be unavailable.`} onRetry={reload} />;

  const update = (c) => {
    setSel(c);
    setData({ ...data, queue: data.queue.map((x) => (x.ticketId === c.ticketId ? c : x)) });
  };

  return (
    <div className="mx-auto max-w-[1700px]">
      <PageHeader eyebrow="Municipal Command Center" title="City pulse, ranked by AI." subtitle="AI priority queue, live ward map and SLA monitoring for Indore (mock)."
        actions={<span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300" data-testid="demo-metrics-label">{data.label}</span>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPIS.map(([k, l, Icon, color], i) => <MetricCard key={k} label={l} value={data.kpis[k]} icon={Icon} accent={color} testId={`kpi-${k}`} delay={i * 60} hint="Demo Metric" />)}
      </div>
      <Section title="Citizen inbox" className="mt-5" testId="citizen-inbox" right={<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live · refreshes every 10s</span>}>
        {data.inbox.length === 0 ? <p className="text-sm text-slate-500" data-testid="inbox-empty">No new citizen reports yet. Reports submitted by signed-in citizens appear here instantly.</p> : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {data.inbox.map((c) => (
              <button key={c.ticketId} onClick={() => setSel(c)} data-testid={`inbox-item-${c.ticketId}`} className="w-72 shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-left animate-fade-up hover:border-cyan-400" style={{ transition: "border-color .2s" }}>
                <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-slate-400">{c.ticketId}</span><span className="rounded bg-cyan-400 px-1.5 font-mono text-[9px] font-bold uppercase text-slate-950">New</span></div>
                <div className="mt-2"><CategoryChip category={c.category} label={c.categoryLabel} /></div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-400">{c.description}</p>
                <div className="mt-3 flex items-center justify-between"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></div>
              </button>
            ))}
          </div>
        )}
      </Section>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Section title="Ward map" className="xl:col-span-5" right={<Link to="/map" className="text-xs text-cyan-300" data-testid="command-open-map">Open full map →</Link>}>
          <RealCivicMap complaints={data.queue} selectedId={sel?.ticketId} onSelect={setSel} className="aspect-[4/5] w-full sm:aspect-[10/7]" hotWards={data.queue.filter(isBreached).map((c) => c.ward)} />
          <p className="mt-3 font-mono text-xs text-slate-500">{data.liveOpen} open in queue · {data.liveBreached} breached · red dashed wards have SLA breaches</p>
        </Section>
        <Section title="AI Priority Queue" className="xl:col-span-7" testId="priority-queue" right={<AiTag>Ranked by AI score</AiTag>}>
          <div className="mb-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticket, ward or category" data-testid="queue-search" className="h-11 border-slate-700 bg-slate-950/60 pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {Object.keys(FILTERS).map((k) => (
                <button key={k} onClick={() => setFilter(k)} data-testid={`queue-filter-${k.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === k ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-700 text-slate-300 hover:border-slate-500"}`} style={{ transition: "background-color .15s, border-color .15s" }}>
                  {k} <span className="opacity-60">{(data.queue || []).filter(FILTERS[k]).length}</span>
                </button>
              ))}
            </div>
          </div>
          {queue.length === 0 ? <p className="py-10 text-center text-sm text-slate-500" data-testid="queue-empty">No complaints match this filter.</p> : (
            <>
              <div className="hidden md:block"><ComplaintTable items={queue} onSelect={setSel} selectedId={sel?.ticketId} /></div>
              <div className="space-y-3 md:hidden">{queue.map((c, i) => <ComplaintCard key={c.ticketId} c={c} rank={i + 1} onClick={setSel} />)}</div>
            </>
          )}
        </Section>
      </div>
      <Drawer open={!!sel} onOpenChange={(o) => !o && setSel(null)} title={sel?.ticketId} description={sel && `Ward ${sel.ward} · ${sel.location}`} testId="complaint-drawer">
        {sel && <QuickView c={sel} onChange={update} />}
      </Drawer>
    </div>
  );
}
