import { useState } from "react";
import { Link } from "react-router-dom";
import { Siren, Zap, AlertTriangle, Timer } from "lucide-react";
import { PageHeader, Section, Btn } from "../components/Layout";
import { EscalationChain } from "../components/EscalationChain";
import { CategoryChip, AiTag } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaTimer } from "../components/SlaTimer";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { notify } from "../components/Toast";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { isBreached, minutesLeft, fmtDateTime, pct } from "../data/constants";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const EscalationCard = ({ c: initial }) => {
  const [c, setC] = useState(initial);
  const [anim, setAnim] = useState(null);
  const chain = c.ai.routing.escalationChain;
  const a = c.ai.action;

  const simulate = async () => {
    try {
      let level = c.escalationLevel;
      while (level < chain.length - 1) {
        setAnim(level + 1);
        await sleep(900);
        const res = await api.escalate(c.ticketId, "Complaint has exceeded expected response time.");
        level = res.complaint.escalationLevel;
        setC(res.complaint);
        await sleep(350);
      }
      notify.success(`${c.ticketId} escalated to Command Center`);
    } catch (e) { notify.error(e.message); }
    setAnim(null);
  };

  return (
    <div className="panel overflow-hidden" data-testid={`escalation-card-${c.ticketId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/30 bg-red-500/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-white">{c.ticketId}</span>
          <span className="rounded-md bg-red-500 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white" data-testid="sla-breached-badge">SLA Breached</span>
        </div>
        <SlaTimer due={c.slaDueAt} />
      </div>
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-3"><CategoryChip category={c.category} label={c.categoryLabel} /><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /><span className="text-xs text-slate-400">Ward {c.ward} · {c.team}</span></div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><AiTag>Action Agent</AiTag><span className="font-mono text-[11px] text-slate-400">{pct(a.confidence)} · {fmtDateTime(a.timestamp)}</span></div>
          <p className="text-sm text-slate-200"><Zap className="mr-1 inline h-4 w-4 text-amber-400" />{a.reason}</p>
          <p className="mt-1 text-sm font-semibold text-white">Recommendation: {c.escalationLevel >= chain.length - 1 ? "At Command Center — direct monitoring." : a.recommendation}</p>
        </div>
        <EscalationChain chain={chain} level={c.escalationLevel} animatingTo={anim} />
        <div className="flex flex-wrap gap-2">
          <Btn variant="danger" onClick={simulate} disabled={anim != null || c.escalationLevel >= chain.length - 1} data-testid={`simulate-escalation-${c.ticketId}`}><Siren className="h-4 w-4" /> {anim != null ? "Escalating…" : "Simulate Escalation"}</Btn>
          <Link to={`/complaints/${c.ticketId}`}><Btn variant="ghost">Open complaint</Btn></Link>
        </div>
      </div>
    </div>
  );
};

export default function Escalations() {
  const { data, loading, error, reload } = useApi(() => api.listComplaints(), []);
  const [busy, setBusy] = useState(false);
  if (loading) return <LoadingState label="Action Agent scanning SLAs…" />;
  if (error) return <ErrorState title="Escalation engine offline" message={error} onRetry={reload} />;

  const breached = data.filter(isBreached);
  const risk = data.filter((c) => !isBreached(c) && c.status !== "RESOLVED" && minutesLeft(c) < 120);
  const breachOne = async () => {
    const target = risk[0] || data.find((c) => c.status !== "RESOLVED" && !isBreached(c));
    if (!target) return;
    setBusy(true);
    try { await api.simulateBreach(target.ticketId); notify.warning(`SLA breach simulated on ${target.ticketId}`); await reload(true); } catch (e) { notify.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Escalation Engine" title="No complaint left behind." subtitle="Action Agent watches every SLA and escalates overdue complaints up the chain of responsibility."
        actions={<Btn variant="ghost" onClick={breachOne} disabled={busy} data-testid="simulate-breach-btn"><AlertTriangle className="h-4 w-4" /> Simulate SLA breach</Btn>} />
      <div className="space-y-5" data-testid="breached-list">
        {breached.length === 0 && <Section><p className="text-sm text-slate-400" data-testid="no-breaches">No SLA breaches right now. Use “Simulate SLA breach” to see the engine in action.</p></Section>}
        {breached.map((c) => <EscalationCard key={c.ticketId} c={c} />)}
      </div>
      {risk.length > 0 && (
        <Section title="At risk (under 2 hours left)" className="mt-8" testId="risk-list">
          <ul className="divide-y divide-slate-800">
            {risk.map((c) => (
              <li key={c.ticketId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link to={`/complaints/${c.ticketId}`} className="font-mono text-sm text-cyan-300">{c.ticketId}</Link>
                <CategoryChip category={c.category} label={c.categoryLabel} />
                <span className="text-xs text-slate-400">Ward {c.ward}</span>
                <span className="flex items-center gap-1 text-amber-300"><Timer className="h-3.5 w-3.5" /><SlaTimer due={c.slaDueAt} /></span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
