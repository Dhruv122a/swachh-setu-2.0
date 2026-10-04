import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Inbox, Clock, AlertTriangle, CheckCircle2, Siren, Camera, Mic, MapPin, Check, Bell } from "lucide-react";

const KPI = [["Total", "128", Inbox, "#38BDF8"], ["Pending", "37", Clock, "#F59E0B"], ["High", "12", AlertTriangle, "#F97316"], ["Resolved", "79", CheckCircle2, "#10B981"], ["Breaches", "6", Siren, "#EF4444"]];
const ROWS = [["#1", "Garbage Overflow", "Ward 17", 94, "2h 14m", "#F59E0B"], ["#2", "Water Leakage", "Ward 12", 91, "1h 32m", "#38BDF8"], ["#3", "Open Drain", "Ward 9", 87, "3h 05m", "#2DD4BF"], ["#4", "Sewage Overflow", "Ward 21", 85, "-0h 42m", "#A3E635"]];
const DOTS = [[30, 40, "#F59E0B"], [34, 46, "#F59E0B"], [62, 30, "#E879F9"], [70, 55, "#38BDF8"], [22, 70, "#38BDF8"], [50, 78, "#A3E635"], [82, 40, "#2DD4BF"]];

// Enterprise "console model": a 3D admin dashboard that un-tilts as you scroll.
export const ConsolePreview = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [38, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.2, 1]);

  return (
    <section ref={ref} className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24" data-testid="console-preview">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow text-cyan-400">Municipal Admin Console</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">An enterprise command center, out of the box.</h2>
        <p className="mt-4 text-slate-400">Every citizen report lands here instantly, ranked by AI priority, pinned on the ward map, and timed against its SLA.</p>
      </div>
      <div style={{ perspective: 1400 }}>
        <motion.div style={{ rotateX, scale, opacity, transformOrigin: "center top" }} className="relative rounded-2xl border border-slate-700 bg-[#0A1020] p-3 shadow-[0_40px_120px_-20px_rgba(6,182,212,0.35)] sm:p-5">
          <div className="mb-3 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /><span className="ml-3 font-mono text-[10px] text-slate-500">swachhsetu.demo/command</span></div>
          <div className="grid grid-cols-5 gap-2">
            {KPI.map(([l, v, Icon, c], i) => (
              <motion.div key={l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08 }} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 sm:p-3">
                <div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-widest text-slate-500 sm:text-[10px]">{l}</span><Icon className="hidden h-3 w-3 sm:block" style={{ color: c }} /></div>
                <p className="mt-1 font-display text-base font-extrabold text-white sm:text-2xl">{v}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-5">
            <div className="relative h-40 overflow-hidden rounded-lg border border-slate-800 bg-[#0B1222] sm:h-56 md:col-span-2">
              <div className="bg-grid absolute inset-0" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path d="M0 45 C30 40 60 55 100 42" stroke="#0E7490" strokeOpacity=".5" strokeWidth="2" fill="none" />
                <path d="M20 100 C35 60 55 40 95 0" stroke="#475569" strokeOpacity=".6" strokeWidth="1.2" fill="none" />
                <polygon points="15,20 50,12 55,50 25,62" fill="rgba(239,68,68,.12)" stroke="#EF4444" strokeDasharray="2 1.5" strokeWidth=".5" className="animate-dash" />
              </svg>
              {DOTS.map(([x, y, c], i) => (
                <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                  <span className="absolute -inset-2 animate-ping rounded-full opacity-40" style={{ background: c, animationDelay: `${i * 0.3}s` }} />
                  <span className="relative block h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                </span>
              ))}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 md:col-span-3">
              <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-widest text-cyan-300">AI Priority Queue</p>
              {ROWS.map(([r, cat, w, p, sla, c], i) => (
                <motion.div key={r} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 border-b border-slate-800/70 px-1 py-2 text-[10px] last:border-0 sm:gap-3 sm:text-xs">
                  <span className="font-mono text-slate-500">{r}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                  <span className="flex-1 truncate text-slate-200">{cat}</span>
                  <span className="hidden text-slate-400 sm:inline">{w}</span>
                  <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 font-mono font-bold text-red-300">{p}</span>
                  <span className={`w-14 text-right font-mono ${sla.startsWith("-") ? "text-red-300" : "text-slate-300"}`}>{sla}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.1, type: "spring" }}
            className="absolute -top-4 right-4 flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-slate-950/95 px-3 py-2 shadow-2xl sm:right-8">
            <Bell className="h-4 w-4 animate-bounce text-cyan-300" />
            <span className="font-mono text-[10px] text-slate-200 sm:text-xs">New citizen report · Ward 17 · P1</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Phone = () => (
  <div className="relative mx-auto w-56 rounded-[2.2rem] border-[6px] border-slate-700 bg-slate-950 p-3 shadow-2xl">
    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-800" />
    <img src="/images/garbage.jpg" alt="" className="h-28 w-full rounded-xl object-cover" />
    <p className="mt-2 text-[11px] text-slate-300">Garbage overflowing for three days near the community park.</p>
    <div className="mt-2 flex gap-2">
      {[Camera, Mic, MapPin].map((Icon, i) => (
        <motion.span key={i} className="grid h-8 flex-1 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15, type: "spring" }}>
          <Icon className="h-3.5 w-3.5" />
        </motion.span>
      ))}
    </div>
    <motion.div className="mt-3 rounded-full bg-cyan-400 py-2 text-center text-xs font-semibold text-slate-950" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>Submit Complaint</motion.div>
    <div className="mt-3 space-y-1.5">
      {["Submitted", "AI Triage", "Assigned"].map((s, i) => (
        <motion.p key={s} className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-300" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 + i * 0.25 }}>
          <Check className="h-3 w-3" />{s}
        </motion.p>
      ))}
    </div>
  </div>
);

export const Portals = () => (
  <section className="border-y border-slate-800 bg-[#0A1020]" data-testid="portals">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-amber-300">Citizen portal → Admin console</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Report on the phone. Resolved from the console.</h2>
        <p className="mt-4 max-w-lg text-slate-400">Citizens sign in, report with photo, voice and location, and follow every ticket in their dashboard. The report reaches the municipal admin within seconds, already triaged and routed.</p>
        <ul className="mt-8 space-y-3">
          {["Separate citizen & admin dashboards with secure sign-in", "Real-time arrival alerts in the Command Center", "Human override with a full, explainable audit trail"].map((t, i) => (
            <motion.li key={t} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex items-center gap-3 text-slate-200">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-500/15 text-cyan-300"><Check className="h-3.5 w-3.5" /></span>{t}
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="relative flex items-center justify-center">
        <motion.div className="absolute h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div initial={{ opacity: 0, y: 40, rotate: -6 }} whileInView={{ opacity: 1, y: 0, rotate: -4 }} viewport={{ once: true }} transition={{ duration: 0.8 }} animate={{ y: [0, -10, 0] }}>
          <Phone />
        </motion.div>
        <motion.div className="absolute -right-2 top-6 hidden rounded-xl border border-emerald-500/50 bg-slate-950/95 px-3 py-2 sm:block" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 1.2 }}>
          <p className="font-mono text-[11px] font-bold text-emerald-300">→ Admin received</p>
          <p className="font-mono text-[9px] text-slate-400">SWC-2026-10482 · 0.8s</p>
        </motion.div>
      </div>
    </div>
  </section>
);
