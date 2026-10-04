import { useParams, Link } from "react-router-dom";
import { Copy, Share2, Radar, LayoutDashboard, Link2 } from "lucide-react";
import { PageHeader, Btn } from "../components/Layout";
import { TicketCard } from "../components/TicketCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { AiTag } from "../components/Badges";
import { notify } from "../components/Toast";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { DEMO_TRACK_DOMAIN, pct } from "../data/constants";

export const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  }
};

export default function Ticket() {
  const { id } = useParams();
  const { data: c, loading, error, reload } = useApi(() => api.getComplaint(id), [id]);
  const { isAdmin } = useAuth();
  if (loading) return <LoadingState label="Generating ticket…" />;
  if (error) return <ErrorState title="Ticket not found" message={error} onRetry={reload} />;

  const url = `${window.location.origin}/track/${c.ticketId}`;
  const copy = async () => (await copyText(url)) ? notify.success("Tracking link copied") : notify.error("Copy failed");
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `SwachhSetu ${c.ticketId}`, text: `Track my civic complaint ${c.ticketId}`, url }); } catch { /* cancelled */ }
    } else copy();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Ticket generated" title="Your complaint is in the right hands." subtitle="Routed automatically. Save the link to track progress — no login needed." />
      <TicketCard c={c} />
      <div className="panel mt-4 p-5">
        <p className="eyebrow mb-2">Public tracking link</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 font-mono text-sm text-cyan-300" data-testid="tracking-link">
            <Link2 className="h-4 w-4 shrink-0" /><span className="truncate">{DEMO_TRACK_DOMAIN}{c.ticketId}</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={copy} data-testid="copy-link-btn"><Copy className="h-4 w-4" /> Copy Link</Btn>
            <Btn variant="ghost" onClick={share} data-testid="share-btn"><Share2 className="h-4 w-4" /> Share</Btn>
          </div>
        </div>
      </div>
      <div className="panel mt-4 space-y-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><AiTag /><span className="font-mono text-xs text-slate-400">Triage {pct(c.confidence)} · Routing {pct(c.ai.routing.confidence)}</span></div>
        <p className="text-sm text-slate-300">{c.ai.triage.reason}</p>
        <p className="text-sm text-slate-400">{c.ai.routing.reason}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/track/${c.ticketId}`} data-testid="track-status-btn"><Btn><Radar className="h-4 w-4" /> Track Status</Btn></Link>
        {isAdmin ? <Link to={`/complaints/${c.ticketId}`} data-testid="open-in-command-btn"><Btn variant="ghost"><LayoutDashboard className="h-4 w-4" /> Officer view</Btn></Link>
          : <Link to="/my" data-testid="open-my-complaints-btn"><Btn variant="ghost"><LayoutDashboard className="h-4 w-4" /> My complaints</Btn></Link>}
      </div>
    </div>
  );
}
