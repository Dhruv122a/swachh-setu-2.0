import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Brain, Route as RouteIcon, Copy, Zap, Ticket as TicketIcon } from "lucide-react";
import { PageHeader, Btn } from "../components/Layout";
import { AgentActivity, KV } from "../components/AgentActivity";
import { PriorityBreakdown } from "../components/PriorityBreakdown";
import { DuplicatePanel } from "../components/DuplicatePanel";
import { CategoryChip, Badge } from "../components/Badges";
import { ErrorState } from "../components/ErrorState";
import { api } from "../services/api";
import { DEMO_LOCATIONS, SAMPLE_TEXT, pct } from "../data/constants";

const STEPS = ["Complaint received", "Image analyzed", "Location validated", "Issue classified", "Severity calculated",
  "Duplicate check completed", "Department identified", "SLA predicted", "Civic insights"];
const DEMO_PAYLOAD = { description: SAMPLE_TEXT, image: "/images/garbage.jpg", hasVoice: false, ...DEMO_LOCATIONS[0] };

const Pipeline = ({ idx }) => {
  const progress = Math.round((idx / STEPS.length) * 100);
  return (
    <div className="panel p-6" data-testid="pipeline">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1E293B" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${progress * 0.974} 100`} style={{ transition: "stroke-dasharray .5s" }} />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-mono text-sm font-bold text-white" data-testid="pipeline-progress">{progress}%</span>
        </div>
        <div><p className="font-display text-lg font-bold text-white">Agentic pipeline</p><p className="font-mono text-xs text-slate-400">4 agents · deterministic mock AI</p></div>
      </div>
      <ol className="space-y-2.5">
        {STEPS.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "todo";
          return (
            <li key={s} data-testid={`pipeline-step-${i}`} className={`flex items-center gap-3 font-mono text-sm ${state === "todo" ? "text-slate-600" : state === "current" ? "text-cyan-300" : "text-slate-200"}`} style={{ transition: "color .3s" }}>
              {state === "done" ? <Check className="h-4 w-4 text-emerald-400" /> : <span className={`ml-1 mr-1 h-2 w-2 rounded-full ${state === "current" ? "animate-pulse bg-cyan-400" : "bg-slate-700"}`} />}
              {s}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default function Processing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const payload = state?.payload || DEMO_PAYLOAD;
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    setError(null);
    api.createComplaint(payload).then(setResult).catch((e) => setError(e.message));
  }, [payload]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, []);
  useEffect(() => {
    if (idx >= STEPS.length || error) return;
    const t = setTimeout(() => setIdx((i) => (i < 3 || result ? i + 1 : i)), 650);
    return () => clearTimeout(t);
  }, [idx, result, error]);

  if (error) return <ErrorState title="AI pipeline could not complete" message={`${error}. Your report was not lost — retry, or continue with the guided demo.`} onRetry={run} />;

  const st = (doneAt) => (result && idx >= doneAt ? "done" : idx >= doneAt - 2 ? "running" : "idle");
  const t = result?.ai.triage, r = result?.ai.routing, d = result?.ai.duplicates, a = result?.ai.action;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="AI Processing" title="Agents at work" subtitle="Understand → Prioritize → Detect duplicates → Route → Act. Every recommendation is explainable."
        actions={idx >= STEPS.length && result && <Btn onClick={() => navigate(`/ticket/${result.ticketId}`)} data-testid="view-ticket-btn"><TicketIcon className="h-4 w-4" /> View Ticket {result.ticketId}</Btn>} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4"><div className="lg:sticky lg:top-24"><Pipeline idx={idx} /></div></div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:col-span-8">
          <AgentActivity name="Triage Agent" icon={Brain} status={st(5)} confidence={t?.confidence} reason={t?.reason} timestamp={t?.timestamp} testId="agent-triage">
            {t && <>
              <div className="grid grid-cols-2 gap-4">
                <KV label="Category" value={<CategoryChip category={t.category} label={t.categoryLabel} />} />
                <KV label="Severity" value={<Badge kind="severity" value={t.severity} />} />
                <KV label="Priority" value={<span className="font-mono text-xl" data-testid="triage-priority">{t.priority} / 100</span>} />
                <KV label="Confidence" value={<span className="font-mono text-xl">{pct(t.confidence)}</span>} />
              </div>
              <PriorityBreakdown factors={t.factors} total={t.priority} />
            </>}
          </AgentActivity>
          <AgentActivity name="Routing Agent" icon={RouteIcon} accent="#38BDF8" status={st(8)} confidence={r?.confidence} reason={r?.reason} timestamp={r?.timestamp} testId="agent-routing">
            {r && <div className="grid grid-cols-2 gap-4">
              <KV label="Department" value={<span data-testid="routing-department">{r.department}</span>} />
              <KV label="Team" value={r.team} />
              <KV label="Priority" value={<span className="font-mono text-red-300">{r.priorityClass}</span>} />
              <KV label="SLA" value={<span className="font-mono">{r.slaHours} hours</span>} />
            </div>}
          </AgentActivity>
          <AgentActivity name="Duplicate Detector" icon={Copy} accent="#F59E0B" status={st(6)} timestamp={d?.timestamp} reason={d?.recommendation} confidence={d?.count ? d.similarity / 100 : null} testId="agent-duplicates">
            <DuplicatePanel dup={d} />
          </AgentActivity>
          <AgentActivity name="Action & Insight Agent" icon={Zap} accent="#10B981" status={st(9)} confidence={a?.confidence} reason={a?.reason} timestamp={a?.timestamp} testId="agent-action">
            {a && <div className="space-y-3">
              <KV label="SLA state" value={<span className="font-mono text-emerald-300">{a.state.replace("_", " ")}</span>} />
              <KV label="Next action" value={a.recommendation} />
              <p className="text-xs text-slate-400">Insight Agent updated Ward {result.ward} hotspot model with this report.</p>
            </div>}
          </AgentActivity>
        </div>
      </div>
    </div>
  );
}
