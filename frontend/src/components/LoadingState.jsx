export const LoadingState = ({ label = "Loading civic data…" }) => (
  <div data-testid="loading-state" className="grid min-h-[40vh] place-items-center">
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => <span key={i} className="h-8 w-1.5 animate-pulse rounded-full bg-cyan-400/70" style={{ animationDelay: `${i * 150}ms` }} />)}
      </div>
      <p className="eyebrow">{label}</p>
    </div>
  </div>
);
