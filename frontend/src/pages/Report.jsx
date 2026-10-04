import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, X, RotateCw, Mic, MicOff, MapPin, Crosshair, Check, Circle, Send, ImagePlus, Sparkles } from "lucide-react";
import { PageHeader, Btn } from "../components/Layout";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { notify } from "../components/Toast";
import { useSpeech } from "../hooks/useSpeech";
import { DEMO_LOCATIONS, SAMPLE_TEXT } from "../data/constants";
import { nearestWard, inCity } from "../data/wards";

const resizeImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const Step = ({ n, title, children, done }) => (
  <section className="panel p-5 sm:p-6">
    <div className="mb-4 flex items-center gap-3">
      <span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs ${done ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{done ? <Check className="h-3.5 w-3.5" /> : n}</span>
      <h2 className="font-display text-lg font-bold text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const PhotoStep = ({ image, setImage }) => {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const handle = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("Please choose an image file.");
    try { setImage(await resizeImage(file)); } catch { notify.error("Could not read that image. Try another photo."); }
  };
  return (
    <Step n={1} title="Photo" done={!!image}>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" data-testid="photo-input" onChange={(e) => handle(e.target.files?.[0])} />
      {image ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-700">
          <img src={image} alt="Complaint preview" className="h-64 w-full object-cover sm:h-80" data-testid="photo-preview" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button onClick={() => input.current?.click()} data-testid="photo-retry-btn" className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/80 text-white backdrop-blur"><RotateCw className="h-4 w-4" /></button>
            <button onClick={() => setImage(null)} data-testid="photo-remove-btn" className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/80 text-white backdrop-blur"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }} data-testid="photo-dropzone"
          className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-4 py-10 text-center ${drag ? "border-cyan-400 bg-cyan-500/5" : "border-slate-700"}`} style={{ transition: "border-color .2s, background-color .2s" }}>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-300"><Camera className="h-8 w-8" /></span>
          <div>
            <p className="font-semibold text-white">Take or upload a photo of the issue</p>
            <p className="mt-1 hidden text-sm text-slate-400 sm:block">Drag & drop an image here, or browse</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Btn onClick={() => input.current?.click()} data-testid="photo-capture-btn"><Upload className="h-4 w-4" /> Camera / Upload</Btn>
            <Btn variant="ghost" onClick={() => setImage("/images/garbage.jpg")} data-testid="photo-sample-btn"><ImagePlus className="h-4 w-4" /> Use sample photo</Btn>
          </div>
        </div>
      )}
    </Step>
  );
};

const VOICE_LABEL = { ready: "Ready", listening: "Listening…", processing: "Processing…", done: "Text generated" };

const DescriptionStep = ({ text, setText, voice }) => (
  <Step n={2} title="Description & Voice" done={text.trim().length >= 10}>
    <div className="flex flex-col items-center gap-3 pb-5">
      <button type="button" data-testid="voice-btn" onClick={voice.state === "listening" ? voice.stop : voice.start}
        className={`relative grid h-24 w-24 place-items-center rounded-full ${voice.state === "listening" ? "bg-red-500 text-white" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"} ${!voice.supported ? "opacity-50" : ""}`} style={{ transition: "background-color .2s" }}>
        {voice.state === "listening" && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
        {voice.supported ? <Mic className="relative h-10 w-10" /> : <MicOff className="relative h-10 w-10" />}
      </button>
      <span data-testid="voice-state" className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${voice.state === "done" ? "border-emerald-500/50 text-emerald-300" : voice.state === "ready" ? "border-slate-700 text-slate-400" : "border-cyan-500/50 text-cyan-300"}`}>{VOICE_LABEL[voice.state]}</span>
      {(voice.error || !voice.supported) && <p className="max-w-sm text-center text-xs text-amber-300" data-testid="voice-error">{voice.error || "Speech recognition isn't supported in this browser — type below instead."}</p>}
      <button onClick={() => voice.simulate(SAMPLE_TEXT)} data-testid="voice-simulate-btn" className="text-xs text-cyan-300 underline-offset-4 hover:underline">Simulate voice input (demo)</button>
    </div>
    <Textarea value={text} onChange={(e) => setText(e.target.value)} data-testid="description-input" rows={5} maxLength={2000}
      placeholder={`e.g. ${SAMPLE_TEXT}`} className="min-h-[140px] border-slate-700 bg-slate-950/60 text-base text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50" />
    <div className="mt-2 flex justify-between text-xs text-slate-500">
      <span>{text.trim().length < 10 ? "At least 10 characters" : "Looks good"}</span>
      <button onClick={() => setText(SAMPLE_TEXT)} data-testid="description-sample-btn" className="text-cyan-300 hover:underline">Use example</button>
    </div>
  </Step>
);

const LocationStep = ({ loc, setLoc }) => {
  const [busy, setBusy] = useState(false);
  const detect = () => {
    if (!navigator.geolocation) return notify.error("Location not available. Please select a demo location.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false);
        const { latitude, longitude } = coords;
        if (!inCity(latitude, longitude)) {
          setLoc(DEMO_LOCATIONS[0]);
          return notify.info("You're outside the demo city — using demo location Shivaji Nagar, Indore.");
        }
        const w = nearestWard(latitude, longitude);
        setLoc({ ward: w.ward, area: w.name, location: `Near ${w.name}`, latitude: +latitude.toFixed(4), longitude: +longitude.toFixed(4) });
      },
      () => { setBusy(false); notify.error("Location permission denied. Select a demo location instead."); },
      { timeout: 8000 }
    );
  };
  return (
    <Step n={3} title="Location" done={!!loc}>
      {loc ? (
        <div className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4" data-testid="location-display">
          <MapPin className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <p className="font-semibold text-white">{loc.location}</p>
            <p className="text-sm text-slate-400">{loc.area} · Ward {loc.ward} · Indore, Madhya Pradesh</p>
            <p className="mt-1 font-mono text-xs text-cyan-300">{loc.latitude}, {loc.longitude}</p>
          </div>
        </div>
      ) : <p className="text-sm text-slate-400">Share your location so the right ward team receives this.</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Btn variant="ghost" onClick={detect} disabled={busy} data-testid="detect-location-btn"><Crosshair className="h-4 w-4" /> {busy ? "Detecting…" : "Detect Location"}</Btn>
        <Select value={loc ? String(DEMO_LOCATIONS.findIndex((d) => d.location === loc.location)) : undefined} onValueChange={(v) => setLoc(DEMO_LOCATIONS[+v])}>
          <SelectTrigger data-testid="demo-location-select" className="h-11 rounded-full border-slate-700 bg-slate-900/60"><SelectValue placeholder="Select Demo Location" /></SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
            {DEMO_LOCATIONS.map((d, i) => <SelectItem key={d.location} value={String(i)} data-testid={`demo-location-${d.ward}`}>Ward {d.ward} · {d.location}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </Step>
  );
};

export default function Report() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [loc, setLoc] = useState(null);
  const [usedVoice, setUsedVoice] = useState(false);
  const voice = useSpeech((t) => { setText((prev) => (prev ? `${prev} ${t}` : t)); setUsedVoice(true); });
  const checks = [["Photo", !!image], ["Description", text.trim().length >= 10], ["Location", !!loc]];
  const ready = checks.every(([, ok]) => ok);

  const submit = () => {
    if (!ready) return notify.error(`Missing: ${checks.filter(([, ok]) => !ok).map(([l]) => l).join(", ")}`);
    navigate("/processing", { state: { payload: { description: text.trim(), image, hasVoice: usedVoice, ward: loc.ward, location: loc.location, latitude: loc.latitude, longitude: loc.longitude } } });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Citizen · Report Issue" title="Report a civic issue" subtitle="Photo + voice or text + location. Our agents handle the rest." />
      <div className="space-y-4 pb-36">
        <PhotoStep image={image} setImage={setImage} />
        <DescriptionStep text={text} setText={setText} voice={voice} />
        <LocationStep loc={loc} setLoc={setLoc} />
        <button onClick={() => { setImage("/images/garbage.jpg"); setText(SAMPLE_TEXT); setLoc(DEMO_LOCATIONS[0]); }} data-testid="fill-demo-btn" className="flex w-full items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-cyan-300">
          <Sparkles className="h-4 w-4" /> Fill with demo complaint
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-slate-800 bg-[#070C18]/95 px-4 py-3 backdrop-blur-xl lg:bottom-0 lg:left-auto lg:right-0 lg:w-[calc(100%-16rem)]">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center gap-4 sm:justify-start" data-testid="submit-checklist">
            {checks.map(([l, ok]) => (
              <span key={l} className={`flex items-center gap-1.5 text-sm ${ok ? "text-emerald-300" : "text-slate-500"}`} data-testid={`check-${l.toLowerCase()}`}>
                {ok ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />} {l}
              </span>
            ))}
          </div>
          <Btn onClick={submit} data-testid="submit-grievance-btn" className={`h-12 w-full sm:w-auto ${ready ? "" : "opacity-60"}`}><Send className="h-4 w-4" /> Submit Complaint</Btn>
        </div>
      </div>
    </div>
  );
}
