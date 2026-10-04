import { useRef, useState } from "react";

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

// state: ready | listening | processing | done | error
export function useSpeech(onText) {
  const [state, setState] = useState("ready");
  const [error, setError] = useState(null);
  const rec = useRef(null);

  const start = () => {
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Please type instead.");
      return;
    }
    try {
      const r = new Recognition();
      r.lang = "en-IN";
      r.interimResults = false;
      r.onresult = (e) => {
        setState("processing");
        const text = Array.from(e.results).map((x) => x[0].transcript).join(" ");
        setTimeout(() => { onText(text); setState("done"); }, 600);
      };
      r.onerror = (e) => {
        setError(e.error === "not-allowed" ? "Microphone permission denied. Please type instead." : "Could not capture voice. Please try again or type.");
        setState("ready");
      };
      r.onend = () => setState((s) => (s === "listening" ? "ready" : s));
      rec.current = r;
      setError(null);
      setState("listening");
      r.start();
    } catch {
      setError("Voice capture failed. Please type instead.");
      setState("ready");
    }
  };

  const stop = () => rec.current?.stop();

  const simulate = (text) => {
    setError(null);
    setState("listening");
    setTimeout(() => setState("processing"), 1400);
    setTimeout(() => { onText(text); setState("done"); }, 2300);
  };

  return { supported: !!Recognition, state, error, start, stop, simulate };
}
