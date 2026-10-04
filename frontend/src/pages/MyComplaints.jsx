import { Link } from "react-router-dom";
import { Camera, Inbox, Clock, CheckCircle2, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, Section, Btn } from "../components/Layout";
import { MetricCard } from "../components/MetricCard";
import { CategoryChip } from "../components/Badges";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaTimer } from "../components/SlaTimer";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { fmtDateTime } from "../data/constants";
import { trackingSteps } from "./Track";

const Progress = ({ c }) => {
  const steps = trackingSteps(c);
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <div>
      <div className="flex gap-1">{steps.map((s) => <span key={s.label} className={`h-1.5 flex-1 rounded-full ${s.state === "done" ? "bg-emerald-400" : s.state === "current" ? "animate-pulse bg-cyan-400" : "bg-slate-800"}`} />)}</div>
      <p className="mt-1.5 font-mono text-[11px] text-slate-400">{steps.find((s) => s.state === "current")?.label || "Resolved"} · {done}/{steps.length}</p>
    </div>
  );
};

export default function MyComplaints() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.myComplaints(), []);
  if (loading) return <LoadingState label="Loading your complaints…" />;
  if (error) return <ErrorState title="Couldn't load your complaints" message={error} onRetry={reload} />;
  const open = data.filter((c) => c.status !== "RESOLVED").length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Citizen dashboard" title={`Namaste, ${user.name.split(" ")[0]}.`} subtitle="Every complaint you report goes straight to the municipal command center. Track them all here."
        actions={<Link to="/report" data-testid="my-report-btn"><Btn><Camera className="h-4 w-4" /> Report new issue</Btn></Link>} />
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Reported" value={data.length} icon={Inbox} testId="my-kpi-total" />
        <MetricCard label="Open" value={open} icon={Clock} accent="#F59E0B" testId="my-kpi-open" delay={60} />
        <MetricCard label="Resolved" value={data.length - open} icon={CheckCircle2} accent="#10B981" testId="my-kpi-resolved" delay={120} />
      </div>
      <Section title="My complaints" className="mt-5" testId="my-complaints-list">
        {data.length === 0 ? (
          <div className="py-12 text-center" data-testid="my-empty">
            <Camera className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-slate-300">You haven't reported anything yet.</p>
            <Link to="/report"><Btn className="mt-5">Report your first issue</Btn></Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((c, i) => (
              <motion.li key={c.ticketId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/track/${c.ticketId}`} data-testid={`my-complaint-${c.ticketId}`} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-cyan-500/50 sm:grid-cols-[96px_1fr_auto]" style={{ transition: "border-color .2s" }}>
                  {c.image ? <img src={c.image} alt="" className="h-24 w-full rounded-lg object-cover sm:w-24" /> : <div className="hidden sm:block" />}
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-500">{c.ticketId}</span><StatusBadge status={c.status} /></div>
                    <CategoryChip category={c.category} label={c.categoryLabel} />
                    <p className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{c.location} · Ward {c.ward} · {fmtDateTime(c.createdAt)}</p>
                    <Progress c={c} />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <PriorityBadge priority={c.priority} />
                    <SlaTimer due={c.slaDueAt} resolved={c.status === "RESOLVED"} />
                    <ArrowRight className="hidden h-4 w-4 text-slate-500 sm:block" />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
