export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="animate-fade-up">
      {eyebrow && <p className="eyebrow mb-2 text-cyan-400">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Section = ({ title, right, children, className = "", testId }) => (
  <section data-testid={testId} className={`panel p-5 sm:p-6 ${className}`}>
    {(title || right) && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {title && <h2 className="font-display text-lg font-bold text-white">{title}</h2>}
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Btn = ({ variant = "primary", className = "", children, ...p }) => {
  const v = {
    primary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    ghost: "border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500 hover:text-white",
    danger: "bg-red-500 text-white hover:bg-red-400",
    success: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  }[variant];
  return (
    <button {...p} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${v} ${className}`}
      style={{ transition: "transform .15s, background-color .2s, border-color .2s, color .2s" }}>
      {children}
    </button>
  );
};
