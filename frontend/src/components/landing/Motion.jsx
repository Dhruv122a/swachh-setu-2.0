import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 24, className = "" }) => (
  <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}>
    {children}
  </motion.div>
);

export const WordReveal = ({ text, highlight, className = "" }) => (
  <h1 className={className}>
    {text.split(" ").map((w, i) => (
      <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
        <motion.span className={`inline-block ${w === highlight ? "text-cyan-400" : ""}`}
          initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}>
          {w}&nbsp;
        </motion.span>
      </span>
    ))}
  </h1>
);

export const CountUp = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const m = value.match(/^([\d.]+)(.*)$/);
  const target = parseFloat(m[1]);
  const decimals = (m[1].split(".")[1] || "").length;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1400);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);
  return <span ref={ref}>{n.toFixed(decimals)}{m[2]}</span>;
};

const EVENTS = [
  ["SWC-2026-10391", "Garbage", "Ward 17", "Sanitation Team", "#F59E0B"],
  ["SWC-2026-10344", "Water Leakage", "Ward 12", "Water Works", "#38BDF8"],
  ["SWC-2026-10383", "Sewage", "Ward 21", "Escalated → Supervisor", "#EF4444"],
  ["SWC-2026-10352", "Streetlight", "Ward 9", "Electrical Team", "#E879F9"],
  ["SWC-2026-10371", "Pothole", "Ward 5", "Road Crew · In Progress", "#F97316"],
  ["SWC-2026-10409", "Drainage", "Ward 24", "Drainage Team", "#2DD4BF"],
];

export const LiveTicker = () => (
  <div className="relative overflow-hidden border-y border-slate-800 bg-[#0A1020] py-3" data-testid="live-ticker">
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0A1020] to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0A1020] to-transparent" />
    <div className="animate-marquee flex w-max gap-10">
      {[...EVENTS, ...EVENTS].map(([id, cat, ward, to, color], i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: color }} />
          <span className="text-slate-200">{id}</span> · {cat} · {ward} → <span style={{ color }}>{to}</span>
        </span>
      ))}
    </div>
  </div>
);
