import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, Map, LayoutDashboard, Flame, Siren, PlayCircle, ChevronsLeft, ChevronsRight, ShieldAlert, ListChecks, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CITIZEN_NAV = [
  { group: "Citizen", items: [
    { to: "/my", label: "My Complaints", icon: ListChecks },
    { to: "/report", label: "Report Issue", icon: Camera },
    { to: "/map", label: "Civic Map", icon: Map },
    { to: "/", label: "Home", icon: Home, end: true },
  ] },
];
const ADMIN_NAV = [
  { group: "Municipal Admin", items: [
    { to: "/command", label: "Command Center", icon: LayoutDashboard },
    { to: "/escalations", label: "Escalations", icon: Siren },
    { to: "/hotspots", label: "Hotspots", icon: Flame },
    { to: "/map", label: "Civic Map", icon: Map },
  ] },
  { group: "Present", items: [{ to: "/demo", label: "Demo Mode", icon: PlayCircle }] },
];
const GUEST_NAV = [{ group: "Explore", items: [
  { to: "/", label: "Home", icon: Home, end: true }, { to: "/map", label: "Civic Map", icon: Map }, { to: "/login", label: "Sign in", icon: LogIn },
] }];

const navFor = (user) => (user?.role === "admin" ? ADMIN_NAV : user ? CITIZEN_NAV : GUEST_NAV);
const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");

export const Logo = ({ compact }) => (
  <Link to="/" className="flex items-center gap-2.5" data-testid="logo-link">
    <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 font-display text-lg font-extrabold text-slate-950">S</span>
    {!compact && (
      <span className="whitespace-nowrap leading-tight">
        <span className="block font-display text-lg font-extrabold tracking-tight text-white">SwachhSetu<span className="text-cyan-400"> 2.0</span></span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Grievance Dispatcher</span>
      </span>
    )}
  </Link>
);

export const PrototypeBadge = () => (
  <span data-testid="prototype-badge" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-300">
    <ShieldAlert className="h-3 w-3 shrink-0" /> <span className="sm:hidden">Prototype · Mock</span><span className="hidden sm:inline">Prototype / Mock Municipal System</span>
  </span>
);

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Link to="/login" data-testid="header-signin-btn" className="rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300">Sign in</Link>;
  return (
    <div className="flex items-center gap-2" data-testid="user-menu">
      <span className="hidden items-center gap-2 rounded-full border border-slate-700 py-1 pl-1 pr-3 sm:flex">
        <span className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-bold ${user.role === "admin" ? "bg-cyan-400 text-slate-950" : "bg-amber-400 text-slate-950"}`}>{user.name?.[0]?.toUpperCase() || "U"}</span>
        <span className="text-xs text-slate-200" data-testid="user-name">{user.name}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500" data-testid="user-role">{user.role === "admin" ? "Admin" : "Citizen"}</span>
      </span>
      <button onClick={async () => { await logout(); navigate("/"); }} data-testid="logout-btn" title="Sign out" className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 text-slate-400 hover:border-red-500/60 hover:text-red-300">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
};

const Sidebar = ({ nav, collapsed, setCollapsed }) => (
  <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-[#0A1020] lg:flex ${collapsed ? "w-[76px]" : "w-64"}`} style={{ transition: "width .25s ease" }} data-testid="sidebar">
    <div className="flex h-16 items-center px-4"><Logo compact={collapsed} /></div>
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {nav.map((g) => (
        <div key={g.group}>
          {!collapsed && <p className="eyebrow mb-2 px-3">{g.group}</p>}
          <div className="space-y-1">
            {g.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} title={label} data-testid={`sidebar-link-${slug(label)}`}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-cyan-500/10 text-cyan-300 shadow-[inset_2px_0_0_#06B6D4]" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
                style={{ transition: "background-color .15s, color .15s" }}>
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <button onClick={() => setCollapsed(!collapsed)} data-testid="sidebar-toggle" className="m-3 flex items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-xs text-slate-400 hover:text-white">
      {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
    </button>
  </aside>
);

const BottomNav = ({ nav }) => {
  const items = nav.flatMap((g) => g.items).slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-[#0A1020]/95 backdrop-blur-xl lg:hidden" data-testid="bottom-nav">
      <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} data-testid={`bottom-nav-${slug(label)}`}
            className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium ${isActive ? "text-cyan-300" : "text-slate-500"}`}>
            <Icon className="h-5 w-5" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = navFor(user);
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#070C18]">
      <Sidebar nav={nav} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-800 bg-[#070C18]/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden"><Logo compact /></div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="eyebrow">{user?.role === "admin" ? "Municipal Admin Console" : user ? "Citizen Portal" : "Public View"}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="font-mono text-[11px] text-slate-500">Indore Municipal Corporation · Mock</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <PrototypeBadge />
            <UserMenu />
          </div>
        </header>
        <main key={pathname} className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <BottomNav nav={nav} />
    </div>
  );
}
