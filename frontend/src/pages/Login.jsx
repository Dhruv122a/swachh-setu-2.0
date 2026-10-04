import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, ShieldCheck, Smartphone, Eye, EyeOff } from "lucide-react";
import { Logo, PrototypeBadge } from "../components/AppShell";
import { Btn } from "../components/Layout";
import { Input } from "../components/ui/input";
import { notify } from "../components/Toast";
import { useAuth, homeFor } from "../context/AuthContext";
import { DEMO_LOCATIONS } from "../data/constants";

const Field = ({ label, children }) => <label className="block"><span className="eyebrow mb-1.5 block">{label}</span>{children}</label>;
const inputCls = "h-12 border-slate-700 bg-slate-950/60 text-base text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50";

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", ward: "17" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={from && !(from.startsWith("/command") && user.role !== "admin") ? from : homeFor(user)} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const u = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, password: form.password, ward: +form.ward });
      notify.success(`Welcome${u.name ? `, ${u.name.split(" ")[0]}` : ""}!`);
      navigate(from || homeFor(u), { replace: true });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="noise relative grid min-h-screen overflow-hidden bg-[#070C18] lg:grid-cols-2">
      <div className="bg-grid absolute inset-0 opacity-50" />
      <div className="relative hidden flex-col justify-between border-r border-slate-800 p-12 lg:flex">
        <Logo />
        <div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white">Two portals.<br /><span className="text-cyan-400">One civic loop.</span></motion.h1>
          <div className="mt-10 space-y-4">
            {[[Smartphone, "Citizen portal", "Report with photo, voice and location. Track every ticket you filed.", "#F59E0B"],
              [ShieldCheck, "Municipal admin", "Receive reports instantly, review AI decisions, assign teams and escalate.", "#06B6D4"]].map(([Icon, t, d, c], i) => (
              <motion.div key={t} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="panel flex gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${c}1a`, color: c }}><Icon className="h-5 w-5" /></span>
                <div><p className="font-display font-bold text-white">{t}</p><p className="text-sm text-slate-400">{d}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="w-fit"><PrototypeBadge /></div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden"><Logo /><PrototypeBadge /></div>
          <div className="mb-6 grid grid-cols-2 rounded-full border border-slate-800 bg-slate-900/70 p-1" data-testid="auth-tabs">
            {[["login", "Sign in", LogIn], ["register", "Create account", UserPlus]].map(([m, l, Icon]) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }} data-testid={`auth-tab-${m}`}
                className={`relative flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold ${mode === m ? "text-slate-950" : "text-slate-400"}`}>
                {mode === m && <motion.span layoutId="authpill" className="absolute inset-0 rounded-full bg-cyan-400" />}
                <span className="relative flex items-center gap-2"><Icon className="h-4 w-4" />{l}</span>
              </button>
            ))}
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white">{mode === "login" ? "Welcome back" : "Join as a citizen"}</h2>
          <p className="mt-1 text-sm text-slate-400">{mode === "login" ? "Citizens and municipal officers sign in here." : "Citizen accounts only. Officer accounts are issued by the municipality."}</p>
          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="auth-form">
            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <Field label="Full name"><Input value={form.name} onChange={set("name")} required minLength={2} data-testid="auth-name-input" className={inputCls} placeholder="Priya Sharma" /></Field>
                  <Field label="Home ward">
                    <select value={form.ward} onChange={set("ward")} data-testid="auth-ward-select" className={`${inputCls} w-full rounded-md border px-3`}>
                      {DEMO_LOCATIONS.map((d) => <option key={d.ward} value={d.ward}>Ward {d.ward} · {d.area}</option>)}
                    </select>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
            <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} required data-testid="auth-email-input" className={inputCls} placeholder="you@example.com" /></Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? "text" : "password"} value={form.password} onChange={set("password")} required minLength={6} data-testid="auth-password-input" className={`${inputCls} pr-12`} placeholder="••••••" />
                <button type="button" onClick={() => setShow(!show)} data-testid="auth-toggle-password" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </Field>
            {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300" data-testid="auth-error">{error}</p>}
            <Btn type="submit" disabled={busy} className="h-12 w-full" data-testid="auth-submit-btn">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create citizen account"}</Btn>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
