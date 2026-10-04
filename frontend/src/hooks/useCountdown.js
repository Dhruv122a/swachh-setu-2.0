import { useEffect, useState } from "react";

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

export function formatDuration(ms, withSeconds = false) {
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const base = `${h}h ${String(m).padStart(2, "0")}m`;
  return withSeconds ? `${base} ${String(s).padStart(2, "0")}s` : base;
}

export function useCountdown(dueIso, withSeconds = false) {
  const now = useNow(withSeconds ? 1000 : 15000);
  const diff = new Date(dueIso).getTime() - now;
  return { diff, breached: diff < 0, text: formatDuration(diff, withSeconds) };
}
