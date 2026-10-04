import { useState } from "react";
import { useParams } from "react-router-dom";
import { ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader, Section, Btn } from "../components/Layout";
import { Timeline } from "../components/Timeline";
import { SlaTimer } from "../components/SlaTimer";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { CategoryChip, AiTag } from "../components/Badges";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { notify } from "../components/Toast";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { fmtDateTime, pct } from "../data/constants";

const LABELS = ["Complaint Submitted", "AI Triage Completed", "Department Assigned", "Field Team Notified", "Inspection Scheduled", "Work In Progress", "Resolved"];
const DONE = { SUBMITTED: 2, ASSIGNED: 4, INSPECTION_SCHEDULED: 5, IN_PROGRESS: 6, RESOLVED: 7 };

export const trackingSteps = (c) => {
  const done = DONE[c.status] ?? 2;
  return LABELS.map((label, i) => ({ label, state: i < done ? "done" : i === done ? "current" : "todo", time: i < 2 ? fmtDateTime(c.createdAt) : undefined }));
};

const Info = ({ label, children }) => <div><p className="eyebrow">{label}</p><div className="mt-1 text-sm font-semibold text-white">{children}</div></div>;

export default function Track() {
  const { id } = useParams();
  const { data: c, loading, error, reload, setData } = useApi(() => api.getComplaint(id), [id]);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  if (loading) return <LoadingState label="Fetching ticket status…" />;
  if (error) return <ErrorState title="Ticket not found" message={error} onRetry={reload} />;

  const sendFeedback = async (resolved) => {
    setBusy(true);
    try {
      const res = await api.feedback(c.ticketId, resolved);
      setData(res.complaint);
      setAction(resolved ? null : res.action);
      resolved ? notify.success("Thank you! Ticket closed.") : notify.warning("We've flagged this for escalation.");
    } catch (e) { notify.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Public tracking" title={c.ticketId} subtitle={`${c.categoryLabel} · ${c.location}`} actions={<StatusBadge status={c.status} testId="track-status" />} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Section title="Progress" className="lg:col-span-2"><Timeline steps={trackingSteps(c)} testId="tracking-timeline" /></Section>
        <div className="space-y-5 lg:col-span-3">
          <Section testId="sla-countdown">
            <p className="eyebrow mb-2">{c.status === "RESOLVED" ? "Resolved" : "Response SLA countdown"}</p>
            <SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} seconds large />
            <p className="mt-2 font-mono text-xs text-slate-500">Due {fmtDateTime(c.slaDueAt)} · {c.slaHours}h window</p>
          </Section>
          <Section>
            <div className="grid gap-5 sm:grid-cols-2">
              <Info label="Category"><CategoryChip category={c.category} label={c.categoryLabel} /></Info>
              <Info label="Priority"><PriorityBadge priority={c.priority} severity={c.severity} /></Info>
              <Info label="Department">{c.department}</Info>
              <Info label="Team">{c.team}</Info>
              <Info label="Location">{c.location}, Ward {c.ward}</Info>
              <Info label="Current status"><StatusBadge status={c.status} /></Info>
            </div>
          </Section>
          <Section title="Was your issue resolved?" testId="feedback-section">
            {c.feedback?.resolved ? (
              <p className="flex items-center gap-2 text-emerald-300" data-testid="feedback-thanks"><CheckCircle2 className="h-5 w-5" /> You confirmed this issue is resolved. Thank you!</p>
            ) : !c.canFeedback ? (
              <p className="text-sm text-slate-400" data-testid="feedback-signin-hint">Only the citizen who reported this complaint can give resolution feedback. <a href="/login" className="text-cyan-300 hover:underline">Sign in</a> with that account.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Btn variant="success" className="h-14" disabled={busy} onClick={() => sendFeedback(true)} data-testid="feedback-yes-btn"><ThumbsUp className="h-5 w-5" /> YES, ISSUE RESOLVED</Btn>
                <Btn variant="danger" className="h-14" disabled={busy} onClick={() => sendFeedback(false)} data-testid="feedback-no-btn"><ThumbsDown className="h-5 w-5" /> NO, STILL NOT RESOLVED</Btn>
              </div>
            )}
            {action && (
              <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 animate-fade-up" data-testid="escalation-recommendation">
                <div className="flex flex-wrap items-center justify-between gap-2"><AiTag>Action Agent</AiTag><span className="font-mono text-xs text-red-200">Confidence {pct(action.confidence)} · {fmtDateTime(action.timestamp)}</span></div>
                <p className="mt-2 flex items-center gap-2 font-display text-lg font-bold text-white"><AlertTriangle className="h-5 w-5 text-red-400" /> {action.recommendation}</p>
                <p className="mt-1 text-sm text-slate-300">{action.reason}</p>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
