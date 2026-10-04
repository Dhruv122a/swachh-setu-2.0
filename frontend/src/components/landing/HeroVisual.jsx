import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Route as RouteIcon, Zap, LineChart, Camera, MapPin, Mic, Ticket } from "lucide-react";

const AGENTS = [
  { name: "Triage", icon: Brain, color: "#06B6D4", pos: "left-1/2 top-0 -translate-x-1/2", out: "Garbage · 94" },
  { name: "Routing", icon: RouteIcon, color: "#38BDF8", pos: "right-0 top-1/2 -translate-y-1/2", out: "SWM · P1" },
  { name: "Action", icon: Zap, color: "#F59E0B", pos: "left-1/2 bottom-0 -translate-x-1/2", out: "SLA 4h" },
  { name: "Insight", icon: LineChart, color: "#10B981", pos: "left-0 top-1/2 -translate-y-1/2", out: "W17 ↑32%" },
];

const Ring = ({ size, duration, dashed, reverse }) => (
  <motion.div className="absolute left-1/2 top-1/2 rounded-full"
    style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, border: `1px ${dashed ? "dashed" : "solid"} rgba(56,189,248,0.25)` }}
    animate={{ rotate: reverse ? -360 : 360 }} transition={{ duration, repeat: Infinity, ease: "linear" }}>
    <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
  </motion.div>
);

// Animated "agent core" model: a complaint flies in, four agents light up in turn, a ticket pops out.
export const HeroVisual = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 6), 1500);
    return () => clearInterval(t);
  }, []);
  const active = phase - 1;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[440px]" style={{ perspective: 900 }} data-testid="hero-visual">
      <div className="absolute inset-0" style={{ transform: "rotateX(58deg)", transformStyle: "preserve-3d" }}>
        <Ring size={420} duration={40} dashed />
        <Ring size={320} duration={26} reverse />
        <Ring size={220} duration={16} dashed />
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        {[[50, 8], [92, 50], [50, 92], [8, 50]].map(([x, y], i) => (
          <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={active === i ? AGENTS[i].color : "#334155"} strokeWidth={active === i ? 0.6 : 0.3} strokeDasharray="1.5 1.5" className="animate-dash" style={{ transition: "stroke .3s" }} />
        ))}
      </svg>

      <motion.div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full sm:h-32 sm:w-32"
        style={{ background: "radial-gradient(circle at 35% 30%, #67E8F9, #0891B2 45%, #0B1222 75%)" }}
        animate={{ scale: [1, 1.07, 1], boxShadow: ["0 0 40px rgba(6,182,212,.35)", "0 0 90px rgba(6,182,212,.6)", "0 0 40px rgba(6,182,212,.35)"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="text-center">
          <p className="font-display text-xl font-extrabold text-white sm:text-2xl">AI</p>
          <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-cyan-100 sm:text-[9px]">4 agents</p>
        </div>
      </motion.div>

      {AGENTS.map((a, i) => {
        const Icon = a.icon;
        const on = active === i;
        return (
          <motion.div key={a.name} className={`absolute ${a.pos}`} animate={{ y: [0, -6, 0] }} transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}>
            <div className="flex flex-col items-center gap-1">
              <motion.span className="grid h-11 w-11 place-items-center rounded-xl border bg-slate-950/90 backdrop-blur sm:h-14 sm:w-14"
                animate={{ scale: on ? 1.18 : 1, borderColor: on ? a.color : "#334155", boxShadow: on ? `0 0 28px ${a.color}aa` : "0 0 0 transparent" }}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: a.color }} />
              </motion.span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-300 sm:text-[10px]">{a.name}</span>
              <AnimatePresence>
                {on && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[9px]" style={{ color: a.color }}>{a.out}</motion.span>}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {phase === 0 && (
          <motion.div key="report" className="absolute left-0 top-2 w-36 rounded-xl border border-amber-500/40 bg-slate-950/95 p-2.5 shadow-2xl sm:-left-6 sm:w-44"
            initial={{ opacity: 0, x: -30, y: -10, rotate: -8 }} animate={{ opacity: 1, x: 0, y: 0, rotate: -4 }}
            exit={{ opacity: 0, x: 90, y: 120, scale: 0.3, rotate: 0, transition: { duration: 0.7, ease: "easeIn" } }}>
            <img src="/images/garbage.jpg" alt="" className="h-14 w-full rounded-md object-cover sm:h-16" />
            <p className="mt-1.5 text-[10px] leading-tight text-slate-200">Garbage overflowing 3 days near park</p>
            <div className="mt-1 flex gap-2 text-amber-300"><Camera className="h-3 w-3" /><Mic className="h-3 w-3" /><MapPin className="h-3 w-3" /></div>
          </motion.div>
        )}
        {phase === 5 && (
          <motion.div key="ticket" className="absolute bottom-6 right-0 rounded-xl border border-emerald-500/50 bg-slate-950/95 px-3 py-2 shadow-2xl sm:-right-6"
            initial={{ opacity: 0, scale: 0.4, x: -80, y: -80 }} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 220, damping: 16 }}>
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-300"><Ticket className="h-3.5 w-3.5" /> SWC-2026-10482</p>
            <p className="font-mono text-[9px] text-slate-400">P1 · Ward 17 Sanitation · Assigned</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
