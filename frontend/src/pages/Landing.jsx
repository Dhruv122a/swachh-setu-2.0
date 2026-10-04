import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, LayoutDashboard, Map, ArrowRight, ArrowDown, Brain, Route as RouteIcon, Zap, LineChart, Smartphone, Users, CheckCircle2, Mic, PlayCircle } from "lucide-react";
import { Logo, PrototypeBadge, UserMenu } from "../components/AppShell";
import { HeroVisual } from "../components/landing/HeroVisual";
import { ConsolePreview, Portals } from "../components/landing/ConsolePreview";
import { useAuth, homeFor } from "../context/AuthContext";
import { Reveal, WordReveal, CountUp, LiveTicker } from "../components/landing/Motion";

const FLOW = [
  { label: "Citizen", icon: Smartphone }, { label: "Photo + Voice + Location", icon: Camera },
  { label: "Triage Agent", icon: Brain, ai: true }, { label: "Routing Agent", icon: RouteIcon, ai: true },
  { label: "Municipal Team", icon: Users }, { label: "Action Agent", icon: Zap, ai: true },
  { label: "Resolution", icon: CheckCircle2 }, { label: "Civic Insights", icon: LineChart, ai: true },
];
const STORY = ["Report", "AI Understands", "AI Prioritizes", "AI Routes", "Team Acts", "Citizen Tracks", "AI Escalates", "City Learns"];
const METRICS = [["94%", "Routing Accuracy"], ["38%", "Faster Triage"], ["2.4K+", "Demo Complaints Resolved"]];
const AGENTS = [
  ["triageAgent()", "Understands the photo, text and voice. Classifies the issue, scores priority 0–100 and explains why.", Brain, "#06B6D4"],
  ["routingAgent()", "Maps the issue to the right department and ward team, with an SLA based on priority.", RouteIcon, "#38BDF8"],
  ["actionAgent()", "Watches every SLA. Recommends supervisor alerts and escalations before citizens give up.", Zap, "#F59E0B"],
  ["insightAgent()", "Learns from the city: ward hotspots, trends and resource deployment recommendations.", LineChart, "#10B981"],
];

const CTA = ({ to, icon: Icon, children, primary, testId }) => (
  <Link to={to} data-testid={testId} className={`group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold hover:-translate-y-0.5 sm:w-auto ${primary ? "bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:bg-cyan-300" : "border border-slate-600 bg-slate-950/50 text-white backdrop-blur hover:border-slate-400"}`} style={{ transition: "transform .15s, background-color .2s, border-color .2s" }}>
    <Icon className="h-4 w-4" /> {children}
    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" style={{ transition: "transform .2s, opacity .2s" }} />
  </Link>
);

const AgentCard = ({ name, desc, Icon, color, i }) => (
  <Reveal delay={i * 0.1} className="h-full">
    <motion.div whileHover={{ y: -6 }} className="group relative h-full overflow-hidden bg-[#0A1020] p-8">
      <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, transition: "opacity .3s" }} />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl group-hover:opacity-40" style={{ background: color, transition: "opacity .4s" }} />
      <motion.span className="relative grid h-12 w-12 place-items-center rounded-xl border border-white/10" style={{ background: `${color}1a` }}
        animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 6, repeat: Infinity, delay: i }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </motion.span>
      <p className="relative mt-5 font-mono text-base font-semibold text-white">{name}</p>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
    </motion.div>
  </Reveal>
);

export default function Landing() {
  const [spot, setSpot] = useState({ x: 50, y: 40 });
  const { user } = useAuth();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070C18]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex"><PrototypeBadge /></span>
            {user && <Link to={homeFor(user)} data-testid="nav-dashboard-link" className="hidden rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold text-white hover:border-slate-400 sm:inline-block">{user.role === "admin" ? "Admin console" : "My dashboard"}</Link>}
            <UserMenu />
          </div>
        </div>
      </header>

      <section className="noise relative overflow-hidden" onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}>
        <motion.img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50"
          initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: "easeOut" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070C18] via-[#070C18]/85 to-[#070C18]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070C18] via-transparent to-transparent" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-0 hidden md:block" style={{ background: `radial-gradient(500px circle at ${spot.x}% ${spot.y}%, rgba(34,211,238,0.12), transparent 60%)` }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-28 sm:px-8 lg:grid-cols-12 lg:pb-24 lg:pt-36">
          <div className="lg:col-span-7">
            <motion.p className="eyebrow text-cyan-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>Agentic AI · Hyperlocal Grievance Dispatcher</motion.p>
            <div className="mt-3 md:hidden"><PrototypeBadge /></div>
            <WordReveal text="Your complaint shouldn't get lost." highlight="lost." className="mt-4 font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl" />
            <Reveal delay={0.6}><p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">SwachhSetu uses Agentic AI to understand, prioritize, route and track local civic complaints.</p></Reveal>
            <Reveal delay={0.7}><p className="mt-2 font-mono text-sm text-amber-300">Report once. Route right. Resolve faster.</p></Reveal>
            <Reveal delay={0.8}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTA to="/report" icon={Camera} primary testId="hero-report-btn">Report an Issue</CTA>
                <CTA to="/command" icon={LayoutDashboard} testId="hero-command-btn">Open Command Center</CTA>
                <CTA to="/map" icon={Map} testId="hero-map-btn">View Civic Map</CTA>
              </div>
            </Reveal>
          </div>
          <motion.div className="lg:col-span-5" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.9 }}>
            <HeroVisual />
          </motion.div>

          <Reveal delay={0.9} className="lg:col-span-12">
            <p className="eyebrow mb-3">Prototype Metrics</p>
            <div className="grid max-w-3xl grid-cols-3 divide-x divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur-md">
              {METRICS.map(([v, l]) => (
                <div key={l} className="min-w-0 p-3 sm:p-6" data-testid={`landing-metric-${l.split(" ")[0].toLowerCase()}`}>
                  <p className="font-display text-2xl font-extrabold text-white sm:text-5xl"><CountUp value={v} /></p>
                  <p className="mt-1 text-[11px] leading-tight text-slate-400 sm:text-sm">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <LiveTicker />

      <ConsolePreview />

      <Portals />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow text-cyan-400">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">One report. Four agents. Zero lost complaints.</h2>
            <p className="mt-4 text-slate-400">Every step is explainable: each AI recommendation shows its confidence, reason and timestamp — and officers can always override.</p>
            <Link to="/demo" data-testid="workflow-demo-link" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Watch the 75-second demo <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <ol className="grid gap-2 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4" data-testid="workflow">
            {FLOW.map(({ label, icon: Icon, ai }, i) => (
              <li key={label}>
                <Reveal delay={i * 0.07}>
                  <motion.div whileHover={{ scale: 1.03 }} className={`relative flex h-full items-center gap-3 overflow-hidden rounded-xl border p-4 ${ai ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800 bg-slate-900/60"}`}>
                    {ai && <motion.span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" animate={{ x: ["-120%", "320%"] }} transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.3 }} />}
                    <span className="font-mono text-xs text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                    <Icon className={`h-5 w-5 shrink-0 ${ai ? "text-cyan-300" : "text-slate-300"}`} />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </motion.div>
                </Reveal>
                {i < FLOW.length - 1 && <ArrowDown className="mx-auto my-1 h-3.5 w-3.5 animate-bounce text-slate-600 sm:hidden" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-[#0A1020]">
        <div className="mx-auto grid max-w-7xl gap-px bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map(([name, desc, Icon, color], i) => <AgentCard key={name} name={name} desc={desc} Icon={Icon} color={color} i={i} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <Reveal><p className="eyebrow mb-6">The civic loop</p></Reveal>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          {STORY.map((s, i) => (
            <motion.span key={s} className="flex items-center gap-3" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
              <span className={`font-display text-xl font-extrabold uppercase tracking-tight sm:text-3xl ${s.startsWith("AI") || s === "City Learns" ? "text-cyan-300" : "text-white"}`}>{s}</span>
              {i < STORY.length - 1 && <ArrowRight className="h-5 w-5 text-slate-600" />}
            </motion.span>
          ))}
        </div>
        <Reveal delay={0.3}>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <CTA to="/report" icon={Mic} primary testId="footer-report-btn">Report with voice</CTA>
            <CTA to={user ? homeFor(user) : "/login"} icon={PlayCircle} testId="footer-demo-btn">{user ? "Open my dashboard" : "Sign in / Create account"}</CTA>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-slate-800 px-5 py-8 text-center font-mono text-[11px] text-slate-500">
        SwachhSetu 2.0 · Hackathon prototype · Mock data & deterministic mock AI · Not connected to any real government system.
      </footer>
    </div>
  );
}
