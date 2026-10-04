import { MapPin, Building2, Users, Clock } from "lucide-react";
import { CategoryChip } from "./Badges";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

const Row = ({ icon: Icon, label, value, testId }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
    <div><p className="eyebrow">{label}</p><p className="text-sm font-semibold text-white" data-testid={testId}>{value}</p></div>
  </div>
);

export const TicketCard = ({ c }) => (
  <div data-testid="ticket-card" className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400" />
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Ticket ID</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white sm:text-3xl" data-testid="ticket-id">{c.ticketId}</p>
        </div>
        <StatusBadge status={c.status} testId="ticket-status" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <CategoryChip category={c.category} label={c.categoryLabel} />
        <PriorityBadge priority={c.priority} severity={c.severity} testId="ticket-priority" />
      </div>
      <div className="my-6 border-t border-dashed border-slate-700" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Row icon={Building2} label="Department" value={c.department} testId="ticket-department" />
        <Row icon={Users} label="Team" value={c.team} testId="ticket-team" />
        <Row icon={MapPin} label="Location" value={`${c.location}, Ward ${c.ward}`} />
        <Row icon={Clock} label="Expected response" value={`Within ${c.slaHours} hours`} testId="ticket-sla" />
      </div>
    </div>
  </div>
);
