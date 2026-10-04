import { Trash2, Construction, Droplets, Lightbulb, Waves, Biohazard } from "lucide-react";

export const CATEGORIES = {
  garbage: { label: "Garbage", full: "Garbage Overflow", color: "#F59E0B", icon: Trash2 },
  pothole: { label: "Pothole", full: "Pothole", color: "#F97316", icon: Construction },
  water: { label: "Water", full: "Water Leakage", color: "#38BDF8", icon: Droplets },
  streetlight: { label: "Streetlight", full: "Streetlight Outage", color: "#E879F9", icon: Lightbulb },
  drainage: { label: "Drainage", full: "Open / Clogged Drain", color: "#2DD4BF", icon: Waves },
  sewage: { label: "Sewage", full: "Sewage Overflow", color: "#A3E635", icon: Biohazard },
};

export const STATUS = {
  SUBMITTED: { label: "Submitted", cls: "bg-slate-700/40 text-slate-200 border-slate-600" },
  ASSIGNED: { label: "Assigned", cls: "bg-sky-500/10 text-sky-300 border-sky-500/40" },
  INSPECTION_SCHEDULED: { label: "Inspection", cls: "bg-cyan-500/10 text-cyan-300 border-cyan-500/40" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-amber-500/10 text-amber-300 border-amber-500/40" },
  RESOLVED: { label: "Resolved", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" },
};

export const SEVERITY = {
  critical: "bg-red-500/15 text-red-300 border-red-500/50",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/50",
  medium: "bg-amber-500/10 text-amber-200 border-amber-500/40",
  low: "bg-slate-600/30 text-slate-300 border-slate-500/50",
};

export const DEMO_LOCATIONS = [
  { ward: 17, location: "Shivaji Nagar Community Park", area: "Shivaji Nagar", latitude: 22.7196, longitude: 75.8577 },
  { ward: 12, location: "Sudama Nagar Sector D", area: "Sudama Nagar", latitude: 22.699, longitude: 75.835 },
  { ward: 9, location: "Vijay Nagar Square", area: "Vijay Nagar", latitude: 22.7533, longitude: 75.8937 },
  { ward: 5, location: "Palasia Square, AB Road", area: "Palasia", latitude: 22.724, longitude: 75.883 },
  { ward: 21, location: "Bhawarkuan Square", area: "Bhawarkuan", latitude: 22.693, longitude: 75.868 },
  { ward: 24, location: "Khajrana Square", area: "Khajrana", latitude: 22.734, longitude: 75.905 },
];

export const SAMPLE_TEXT = "Garbage has been overflowing for three days near the community park.";
export const DEMO_TRACK_DOMAIN = "swachhsetu.demo/track/";

export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
export const pct = (v) => `${Math.round((v || 0) * 100)}%`;
export const isBreached = (c) => c.status !== "RESOLVED" && new Date(c.slaDueAt) < new Date();
export const minutesLeft = (c) => (new Date(c.slaDueAt) - new Date()) / 60000;
