import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, SkipForward, RotateCcw, Check, ScanLine, MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { PageHeader, Btn } from "../components/Layout";
import { PriorityBreakdown } from "../components/PriorityBreakdown";
import { DuplicatePanel } from "../components/DuplicatePanel";
import { TicketCard } from "../components/TicketCard";
import { EscalationChain } from "../components/EscalationChain";
import { ResourceRecommendation } from "../components/ResourceRecommendation";
import { RealCivicMap } from "../components/RealCivicMap";
import { Timeline } from "../components/Timeline";
import { ComplaintCard } from "../components/ComplaintCard";
import { CategoryChip, AiTag, OfficerTag, Badge } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { SlaTimer } from "../components/SlaTimer";
import { ErrorState } from "../components/ErrorState";
import { trackingSteps } from "./Track";
import { api } from "../services/api";
import { DEMO_LOCATIONS, SAMPLE_TEXT, pct } from "../data/constants";

const STEPS = [
  "Citizen submits complaint", "AI analyzes image", "Triage → Garbage", "Priority → 94", "Routing → Solid Waste Management",
  "Duplicate detection", "Ticket generated", "Command Center receives complaint", "Officer assigns team", "IN PROGRESS",
  "Simulate SLA breach", "Action Agent escalates", "Ward 17 becomes hotspot", "Resource recommendation appears",
];
const STEP_MS = 5500;
const PAYLOAD = { description: SAMPLE_TEXT, image: "/images/garbage.jpg", hasVoice: true, ...DEMO_LOCATIONS[0] };

const EFFECTS = {
  0: async () => ({ c: await api.createComplaint(PAYLOAD) }),
  7: async () => ({ queue: (await api.dashboard()).queue.slice(0, 4) }),
  8: async (d) => ({ c: await api.override(d.c.ticketId, { accept: true, note: "Demo: officer accepted AI" }) }),
  9: async (d) => ({ c: await api.setStatus(d.c.ticketId, "IN_PROGRESS", "Field team on site") }),
  10: async (d) => ({ c: await api.simulateBreach(d.c.ticketId) }),
  11: async (d) => ({ c: (await api.escalate(d.c.ticketId, "Complaint has exceeded expected response time.")).complaint }),
  12: async () => ({ h: await api.hotspots() }),
};

const Big = ({ children }) => <p className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{children}</p>;

const Stage = ({ step, d }) => {
  const c = d.c;
  if (!c) return null;
  const t = c.ai.triage, r = c.ai.routing;
  switch (step) {
    case 0: return (
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border-4 border-slate-700 bg-slate-950">
        <img src={c.image} alt="" className="h-52 w-full object-cover" />
        <div className="space-y-3 p-5">
          <p className="text-sm text-slate-200">“{c.description}”</p>
          <p className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {c.location} · 22.7196, 75.8577</p>
          <div className="rounded-full bg-cyan-400 py-2.5 text-center text-sm font-semibold text-slate-950">Submit Complaint</div>
        </div>
      </div>);
    case 1: return (
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-xl border border-cyan-500/40">
        <img src={c.image} alt="" className="h-72 w-full object-cover" />
        <div className="absolute inset-0"><div className="animate-scan h-1/3 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" /></div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {["Visible waste accumulation", "Public location", "Outdoor · daylight"].map((s) => <span key={s} className="rounded-md bg-slate-950/85 px-2 py-1 font-mono text-[11px] text-cyan-300"><ScanLine className="mr-1 inline h-3 w-3" />{s}</span>)}
        </div>
      </div>);
    case 2: return <div className="space-y-4"><AiTag>Triage Agent</AiTag><div className="scale-150 origin-left py-3"><CategoryChip category={t.category} label={t.categoryLabel} /></div><p className="font-mono text-cyan-300">Confidence {pct(t.confidence)} · Severity <Badge kind="severity" value={t.severity} /></p><p className="text-slate-400">{t.reason}</p></div>;
    case 3: return <div className="grid gap-6 md:grid-cols-2 md:items-center"><div><p className="eyebrow">AI priority</p><Big>{t.priority}<span className="text-2xl text-slate-500"> / 100</span></Big></div><PriorityBreakdown factors={t.factors} total={t.priority} /></div>;
    case 4: return <div className="space-y-3"><AiTag>Routing Agent</AiTag><Big>{r.department}</Big><p className="text-lg text-slate-200">{r.team} · <span className="font-mono text-red-300">{r.priorityClass}</span> · {pct(r.confidence)}</p><p className="text-slate-400">{r.reason}</p></div>;
    case 5: return <div className="max-w-xl space-y-3"><DuplicatePanel dup={c.ai.duplicates} /><p className="text-sm text-slate-400">{c.ai.duplicates.recommendation}</p></div>;
    case 6: return <div className="max-w-xl"><TicketCard c={c} /></div>;
    case 7: return <div className="grid gap-3 md:grid-cols-2">{(d.queue || []).map((q, i) => <div key={q.ticketId} className={q.ticketId === c.ticketId ? "rounded-xl ring-2 ring-cyan-400" : ""}><ComplaintCard c={q} rank={i + 1} /></div>)}</div>;
    case 8: return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5"><AiTag /><p className="mt-3 text-white">{r.team}</p><p className="font-mono text-sm text-slate-400">Priority {t.priority}</p></div>
        <div className="panel border-emerald-500/40 p-5"><OfficerTag /><p className="mt-3 flex items-center gap-2 text-white"><Check className="h-4 w-4 text-emerald-400" /> Accepted · {c.officerDecision?.team}</p><p className="font-mono text-sm text-slate-400">Demo Officer</p></div>
      </div>);
    case 9: return <div className="grid gap-6 md:grid-cols-2"><div><StatusBadge status={c.status} /><Big>Work in progress</Big></div><Timeline steps={trackingSteps(c)} testId="demo-timeline" /></div>;
    case 10: return <div className="space-y-3"><p className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-red-400"><AlertTriangle className="h-5 w-5" /> SLA Breached</p><SlaTimer due={c.slaDueAt} seconds large /><p className="text-slate-400">Expected response window of {c.slaHours} hours exceeded.</p></div>;
    case 11: return <div className="space-y-5"><AiTag>Action Agent</AiTag><p className="text-lg text-white">Complaint has exceeded expected response time. Escalated to <b>{r.escalationChain[c.escalationLevel]}</b>.</p><EscalationChain chain={r.escalationChain} level={c.escalationLevel} /></div>;
    case 12: {
      const tr = d.h?.trends.find((x) => x.ward === 17);
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-center">
          <RealCivicMap complaints={d.queue || []} heatmap hotWards={[17]} className="aspect-[4/5] w-full sm:aspect-[10/7]" />
          <div><p className="eyebrow">Insight Agent</p><Big>Ward 17</Big><p className="mt-2 flex items-center gap-2 font-mono text-2xl font-bold text-red-300"><TrendingUp className="h-6 w-6" /> Garbage ↑ {tr?.change}%</p><p className="mt-2 text-slate-400">Now flagged as a civic hotspot.</p></div>
        </div>);
    }
    case 13: return <ResourceRecommendation rec={d.h?.recommendation} />;
    default: return null;
  }
};

export default function Demo() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const dataRef = useRef({});

  const goTo = async (i) => {
    if (i >= STEPS.length || busy) return;
    setBusy(true); setError(null);
    try {
      if (EFFECTS[i]) { dataRef.current = { ...dataRef.current, ...(await EFFECTS[i](dataRef.current)) }; setData(dataRef.current); }
      setStep(i);
    } catch (e) { setError(e.message); setPlaying(false); }
    setBusy(false);
  };

  useEffect(() => {
    if (!playing || busy) return;
    if (step >= STEPS.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => goTo(step + 1), step < 0 ? 0 : STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, busy, step]);

  const reset = () => { setPlaying(false); setStep(-1); setError(null); dataRef.current = {}; setData({}); };
  const elapsed = Math.max(0, step) * STEP_MS / 1000;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Demo Mode · ~77 seconds" title="Garbage overflow near community park" subtitle="One click walks judges through the whole civic loop — using the real prototype API."
        actions={<>
          {playing ? <Btn onClick={() => setPlaying(false)} data-testid="demo-pause-btn"><Pause className="h-4 w-4" /> Pause</Btn>
            : <Btn onClick={() => setPlaying(true)} disabled={step >= STEPS.length - 1} data-testid="demo-play-btn"><Play className="h-4 w-4" /> Play</Btn>}
          <Btn variant="ghost" onClick={() => goTo(step + 1)} disabled={busy || step >= STEPS.length - 1} data-testid="demo-next-btn"><SkipForward className="h-4 w-4" /> Next</Btn>
          <Btn variant="ghost" onClick={reset} data-testid="demo-reset-btn"><RotateCcw className="h-4 w-4" /> Reset</Btn>
        </>} />
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width .5s" }} data-testid="demo-progress" /></div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ol className="panel p-4 lg:col-span-4" data-testid="demo-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button onClick={() => !busy && i === step + 1 && goTo(i)} data-testid={`demo-step-${i}`} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === step ? "bg-cyan-500/10 text-cyan-200" : i < step ? "text-slate-300" : "text-slate-600"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] ${i < step ? "bg-emerald-500/20 text-emerald-300" : i === step ? "bg-cyan-400 text-slate-950" : "bg-slate-800"}`}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
                {s}
              </button>
            </li>
          ))}
          <p className="mt-3 px-3 font-mono text-xs text-slate-500" data-testid="demo-elapsed">Elapsed ≈ {elapsed.toFixed(0)}s / 77s</p>
        </ol>
        <div className="noise relative min-h-[460px] overflow-hidden rounded-xl border border-slate-800 bg-[#0A1120] p-6 sm:p-10 lg:col-span-8" data-testid="demo-stage">
          <div className="bg-grid absolute inset-0 opacity-50" />
          <div className="relative">
            {error ? <ErrorState title="Demo step failed" message={error} onRetry={() => goTo(step + 1)} /> : step < 0 ? (
              <div className="py-16"><p className="eyebrow text-cyan-400">Ready</p><Big>Press Play to start the story.</Big><p className="mt-3 max-w-lg text-slate-400">A citizen reports overflowing garbage at Shivaji Nagar Community Park, Indore. Watch four agents take it from photo to escalation to city insight.</p></div>
            ) : (
              <div key={step} className="animate-fade-up">
                <p className="eyebrow mb-4">Step {step + 1} / {STEPS.length} · {STEPS[step]}</p>
                <Stage step={step} d={data} />
                {data.c && step >= 6 && <p className="mt-8 font-mono text-xs text-slate-500">Live ticket: <Link className="text-cyan-300" to={`/complaints/${data.c.ticketId}`} data-testid="demo-ticket-link">{data.c.ticketId}</Link></p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
