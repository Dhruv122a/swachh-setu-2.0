import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Brain, Route as RouteIcon, Copy, MapPin, Mic, ShieldCheck, Pencil, Siren, Radar } from "lucide-react";
import { PageHeader, Section, Btn } from "../components/Layout";
import { AgentActivity, KV } from "../components/AgentActivity";
import { PriorityBreakdown } from "../components/PriorityBreakdown";
import { DuplicatePanel } from "../components/DuplicatePanel";
import { AuditLog } from "../components/AuditLog";
import { SlaTimer } from "../components/SlaTimer";
import { EscalationChain } from "../components/EscalationChain";
import { Modal } from "../components/Modal";
import { CategoryChip, Badge, AiTag, OfficerTag } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { notify } from "../components/Toast";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { STATUS, CATEGORIES, fmtDateTime, pct } from "../data/constants";

const Pick = ({ value, onChange, options, testId }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger data-testid={testId} className="h-10 border-slate-700 bg-slate-950/60"><SelectValue /></SelectTrigger>
    <SelectContent className="max-h-72 border-slate-700 bg-slate-900 text-slate-100">
      {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
    </SelectContent>
  </Select>
);

const OverrideForm = ({ c, meta, onSave }) => {
  const [form, setForm] = useState({ category: c.category, priority: c.priority, department: c.department, team: c.team, note: "" });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="eyebrow mb-1">Category</p><Pick testId="override-category" value={form.category} onChange={set("category")} options={Object.entries(CATEGORIES).map(([k, v]) => [k, v.full])} /></div>
        <div><p className="eyebrow mb-1">Priority (1–100)</p><Input type="number" min={1} max={100} value={form.priority} onChange={(e) => set("priority")(e.target.value)} data-testid="override-priority" className="h-10 border-slate-700 bg-slate-950/60" /></div>
      </div>
      <div><p className="eyebrow mb-1">Department</p><Pick testId="override-department" value={form.department} onChange={set("department")} options={(meta?.departments || [c.department]).map((d) => [d, d])} /></div>
      <div><p className="eyebrow mb-1">Team</p><Pick testId="override-team" value={form.team} onChange={set("team")} options={(meta?.teams || [c.team]).map((t) => [t, t])} /></div>
      <div><p className="eyebrow mb-1">Officer note</p><Textarea value={form.note} onChange={(e) => set("note")(e.target.value)} data-testid="override-note" placeholder="Why are you overriding the AI?" className="border-slate-700 bg-slate-950/60" /></div>
      <p className="text-xs text-slate-500">The original AI recommendation is preserved and the change is written to the audit trail.</p>
      <Btn className="w-full" data-testid="override-save-btn" onClick={() => {
        const p = parseInt(form.priority, 10);
        if (!(p >= 1 && p <= 100)) return notify.error("Priority must be between 1 and 100");
        onSave({ category: form.category !== c.category ? form.category : undefined, priority: p, department: form.department, team: form.team, note: form.note || undefined });
      }}>Apply Officer Decision</Btn>
    </div>
  );
};

const DecisionCol = ({ tag, rows, empty }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
    <div className="mb-3">{tag}</div>
    {empty ? <p className="text-sm text-slate-500">{empty}</p> : (
      <dl className="space-y-2 text-sm">{rows.map(([k, v]) => <div key={k}><dt className="eyebrow">{k}</dt><dd className="font-semibold text-white">{v}</dd></div>)}</dl>
    )}
  </div>
);

const OverridePanel = ({ c, meta, run }) => {
  const [open, setOpen] = useState(false);
  const ai = c.ai.triage, ar = c.ai.routing, od = c.officerDecision;
  return (
    <Section title="Human Override" testId="override-panel">
      <div className="grid gap-3 sm:grid-cols-2">
        <DecisionCol tag={<AiTag />} rows={[["Category", ai.categoryLabel], ["Priority", `${ai.priority} · ${pct(ai.confidence)}`], ["Department", ar.department], ["Team", ar.team]]} />
        <DecisionCol tag={<OfficerTag />} empty={!od && "Pending officer review"}
          rows={od ? [["Category", CATEGORIES[od.category]?.full], ["Priority", od.priority], ["Department", od.department], ["Team", od.team], ["Decision", od.accepted ? "Accepted AI" : `Override · ${fmtDateTime(od.timestamp)}`]] : []} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Btn variant="success" data-testid="accept-ai-btn" onClick={() => run(() => api.override(c.ticketId, { accept: true }), "AI recommendation accepted")}><ShieldCheck className="h-4 w-4" /> Accept AI</Btn>
        <Btn variant="ghost" data-testid="open-override-btn" onClick={() => setOpen(true)}><Pencil className="h-4 w-4" /> Override</Btn>
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Officer override" description="Change category, priority, department or reassign the team." testId="override-modal">
        <OverrideForm c={c} meta={meta} onSave={async (body) => { await run(() => api.override(c.ticketId, body), "Officer decision recorded"); setOpen(false); }} />
      </Modal>
    </Section>
  );
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const { data: c, loading, error, reload, setData } = useApi(() => api.getComplaint(id), [id]);
  const { data: meta } = useApi(() => api.meta(), []);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  if (loading) return <LoadingState label="Loading complaint…" />;
  if (error) return <ErrorState title="Complaint not found" message={error} onRetry={reload} />;

  const run = async (fn, msg) => {
    setBusy(true);
    try { const res = await fn(); setData(res.complaint || res); notify.success(msg); } catch (e) { notify.error(e.message); }
    setBusy(false);
  };
  const t = c.ai.triage, r = c.ai.routing, a = c.ai.action;

  return (
    <div className="mx-auto max-w-[1500px]">
      <Link to="/command" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white" data-testid="back-to-command"><ArrowLeft className="h-4 w-4" /> Command Center</Link>
      <PageHeader eyebrow={`Complaint · Ward ${c.ward}`} title={c.ticketId} subtitle={c.categoryLabel}
        actions={<><StatusBadge status={c.status} testId="detail-status" /><PriorityBadge priority={c.priority} severity={c.severity} testId="detail-priority" /></>} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Section title="Complaint">
            <div className="grid gap-5 sm:grid-cols-2">
              {c.image ? <img src={c.image} alt="Reported issue" className="h-56 w-full rounded-lg object-cover" data-testid="detail-photo" /> : <div className="grid h-56 place-items-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">No photo</div>}
              <div className="space-y-3">
                <p className="text-slate-200" data-testid="detail-description">{c.description}</p>
                <p className="flex items-start gap-2 text-sm text-slate-400"><MapPin className="mt-0.5 h-4 w-4" />{c.location}, {c.wardName} (Ward {c.ward}), {c.city}</p>
                <p className="font-mono text-xs text-cyan-300">{c.latitude}, {c.longitude}</p>
                <p className="font-mono text-xs text-slate-500">{c.citizenRef} · personal details withheld {c.hasVoice && <span className="ml-1 inline-flex items-center gap-1 text-amber-300"><Mic className="h-3 w-3" />voice</span>}</p>
                <p className="font-mono text-xs text-slate-500">Submitted {fmtDateTime(c.createdAt)}</p>
              </div>
            </div>
          </Section>
          <AgentActivity name="AI Triage" icon={Brain} confidence={t.confidence} reason={t.reason} timestamp={t.timestamp} testId="detail-triage">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KV label="Category" value={<CategoryChip category={t.category} label={t.categoryLabel} />} />
              <KV label="Severity" value={<Badge kind="severity" value={t.severity} />} />
              <KV label="Priority" value={<span className="font-mono">{t.priority} / 100</span>} />
              <KV label="Confidence" value={<span className="font-mono">{pct(t.confidence)}</span>} />
            </div>
            <div><p className="eyebrow mb-2">Why this priority?</p><PriorityBreakdown factors={t.factors} total={t.priority} /></div>
          </AgentActivity>
          <AgentActivity name="AI Routing" icon={RouteIcon} accent="#38BDF8" confidence={r.confidence} reason={r.reason} timestamp={r.timestamp} testId="detail-routing">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KV label="Department" value={r.department} /><KV label="Team" value={r.team} /><KV label="Class" value={r.priorityClass} mono /><KV label="SLA" value={`${r.slaHours}h`} mono />
            </div>
          </AgentActivity>
          <AgentActivity name="Duplicate Detection" icon={Copy} accent="#F59E0B" reason={c.ai.duplicates.recommendation} timestamp={c.ai.duplicates.timestamp} testId="detail-duplicates">
            <DuplicatePanel dup={c.ai.duplicates} />
          </AgentActivity>
        </div>
        <div className="space-y-5 lg:col-span-5">
          <Section title="SLA" testId="detail-sla" right={<Link to={`/track/${c.ticketId}`} className="inline-flex items-center gap-1 text-xs text-cyan-300" data-testid="detail-track-link"><Radar className="h-3.5 w-3.5" /> Citizen view</Link>}>
            <SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} seconds large />
            <p className="mt-1 font-mono text-xs text-slate-500">Due {fmtDateTime(c.slaDueAt)} · {c.slaHours}h window</p>
            <div className={`mt-4 rounded-lg border p-3 ${a.state === "SLA_BREACHED" ? "border-red-500/50 bg-red-500/10" : "border-slate-800 bg-slate-950/50"}`}>
              <div className="mb-1 flex items-center justify-between"><AiTag>Action Agent</AiTag><span className="font-mono text-[11px] text-slate-400">{pct(a.confidence)} · {fmtDateTime(a.timestamp)}</span></div>
              <p className="font-semibold text-white" data-testid="action-recommendation">{a.recommendation}</p>
              <p className="text-sm text-slate-400">{a.reason}</p>
            </div>
            <div className="mt-4"><EscalationChain chain={r.escalationChain} level={c.escalationLevel} /></div>
            <Btn variant="danger" className="mt-4 w-full" disabled={busy || c.escalationLevel >= 3} data-testid="trigger-escalation-btn" onClick={() => run(() => api.escalate(c.ticketId), "Escalated")}><Siren className="h-4 w-4" /> Trigger Escalation</Btn>
          </Section>
          <OverridePanel c={c} meta={meta} run={run} />
          <Section title="Change status">
            <div className="flex gap-2">
              <div className="flex-1"><Pick testId="status-select" value={status || c.status} onChange={setStatus} options={Object.entries(STATUS).map(([k, v]) => [k, v.label])} /></div>
              <Btn disabled={busy || !status || status === c.status} data-testid="status-update-btn" onClick={() => run(() => api.setStatus(c.ticketId, status), `Status → ${STATUS[status].label}`)}>Update</Btn>
            </div>
          </Section>
          <Section title="Audit Trail"><AuditLog entries={c.audit} /></Section>
        </div>
      </div>
    </div>
  );
}
