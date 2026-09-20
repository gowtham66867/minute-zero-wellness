"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Brain, Check, ChevronRight, Clock3, Compass, Database, HeartPulse, LockKeyhole, Moon, RotateCcw, ShieldCheck, Sparkles, Utensils, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { type CheckIn, type Outcome, type Pillar, demoOutcomes, pillarSignals, recommend } from "@/lib/wq-engine";

const pillarOptions: { id: Pillar | "choose"; label: string; short: string; icon: typeof Brain }[] = [
  { id: "stress", label: "Stress mastery", short: "Calm", icon: Brain },
  { id: "movement", label: "Movement", short: "Move", icon: Activity },
  { id: "sleep", label: "Deep sleep", short: "Rest", icon: Moon },
  { id: "nourishment", label: "Mindful eating", short: "Fuel", icon: Utensils },
  { id: "connection", label: "Connection", short: "Connect", icon: Users },
  { id: "purpose", label: "Thriving", short: "Purpose", icon: Compass },
];

const storageKey = "minute-zero-outcomes-v2";

export default function Home() {
  const [checkIn, setCheckIn] = useState<CheckIn>({ mentalLoad: 6, energy: 4, minutes: 3, pillar: "choose" });
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [created, setCreated] = useState(false);
  const [guided, setGuided] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [after, setAfter] = useState(5);
  const [coachSignal, setCoachSignal] = useState(false);

  const result = useMemo(() => recommend(checkIn, outcomes), [checkIn, outcomes]);
  const signals = useMemo(() => pillarSignals(checkIn, outcomes), [checkIn, outcomes]);
  const totalSeconds = checkIn.minutes * 60;
  const elapsed = Math.max(0, totalSeconds - secondsLeft);
  const activeStep = Math.min(2, Math.floor(elapsed / Math.max(1, totalSeconds / 3)));
  const timerProgress = totalSeconds ? (elapsed / totalSeconds) * 100 : 0;
  const matchScore = Math.min(99, Math.round(72 + result.score / 5));

  useEffect(() => {
    try { setOutcomes(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setOutcomes([]); }
  }, []);

  useEffect(() => {
    if (!guided || completed || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) { window.clearInterval(timer); setCompleted(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [guided, completed, secondsLeft]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "configure_wq_reset",
      title: "Configure WQ reset",
      description: "Configure the visible six-pillar WQ check-in and generate an explainable adaptive reset.",
      inputSchema: { type: "object", properties: { mentalLoad: { type: "integer", minimum: 1, maximum: 10 }, energy: { type: "integer", minimum: 1, maximum: 10 }, minutes: { type: "integer", enum: [1, 3, 5, 10] }, pillar: { type: "string", enum: ["stress", "movement", "sleep", "nourishment", "connection", "purpose", "choose"] } }, required: ["mentalLoad", "energy", "minutes", "pillar"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as CheckIn;
        if (!Number.isInteger(value.mentalLoad) || value.mentalLoad < 1 || value.mentalLoad > 10 || !Number.isInteger(value.energy) || value.energy < 1 || value.energy > 10 || ![1,3,5,10].includes(value.minutes) || !["stress","movement","sleep","nourishment","connection","purpose","choose"].includes(value.pillar)) throw new Error("Invalid WQ check-in");
        setCheckIn(value); setCreated(true);
        return { status: "configured", adaptive: true, visible: true };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function update<K extends keyof CheckIn>(key: K, value: CheckIn[K]) { setCheckIn(current => ({ ...current, [key]: value })); }
  function startGuided() { setSecondsLeft(totalSeconds); setCompleted(false); setAfter(Math.max(1, checkIn.mentalLoad - 1)); setGuided(true); }
  function finishReset() { setCompleted(true); setSecondsLeft(0); }
  function loadDemo() {
    if (demoMode) { setDemoMode(false); try { setOutcomes(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setOutcomes([]); } setCreated(false); return; }
    setDemoMode(true); setOutcomes(demoOutcomes); setCheckIn({ mentalLoad: 8, energy: 3, minutes: 1, pillar: "stress" }); setCreated(true);
  }
  function saveReflection() {
    const outcome: Outcome = { interventionId: result.intervention.id, pillar: result.intervention.pillar, before: checkIn.mentalLoad, after, at: new Date().toISOString() };
    const next = [...outcomes, outcome];
    setOutcomes(next);
    if (!demoMode) localStorage.setItem(storageKey, JSON.stringify(next));
    setGuided(false); setCreated(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#061816] text-[#f4f4ec]">
      <div className="pointer-events-none fixed inset-0 opacity-80 [background:radial-gradient(circle_at_18%_12%,rgba(184,255,92,.13),transparent_26%),radial-gradient(circle_at_88%_76%,rgba(255,111,79,.12),transparent_30%)]" />
      <header className="relative mx-auto flex max-w-[1480px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#b8ff5c] text-[#061816]"><HeartPulse className="size-5" strokeWidth={2.5} /></span><div><p className="text-lg font-semibold tracking-[-0.04em]">minute zero <span className="font-normal text-[#637b75]">// WQ intelligence</span></p><p className="text-xs text-[#93aaa4]">an adaptive wellness response layer</p></div></div>
        <div className="flex items-center gap-2"><button onClick={loadDemo} className={`rounded-full border px-3 py-2 text-xs transition ${demoMode ? "border-[#ff6f4f]/50 bg-[#ff6f4f]/10 text-[#ff9279]" : "border-white/10 text-[#93aaa4] hover:border-[#b8ff5c]/40 hover:text-[#b8ff5c]"}`}>{demoMode ? "Exit demo profile" : "Load judge demo"}</button><span className="hidden items-center gap-2 text-xs text-[#78908a] sm:flex"><LockKeyhole className="size-3.5" />On-device</span></div>
      </header>

      <div className="relative mx-auto grid max-w-[1480px] gap-8 px-5 pb-10 pt-3 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(410px,.95fr)] lg:px-12 lg:pb-16 lg:pt-7">
        <section className="order-2 flex flex-col justify-between lg:order-1 lg:min-h-[calc(100vh-132px)]">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-3 text-sm text-[#b8ff5c]"><span className="h-px w-8 bg-current" /><span>{demoMode ? "Sample response fingerprint loaded" : "From generic advice to personal evidence"}</span></div>
            <h1 className="max-w-4xl text-[clamp(3.15rem,7.4vw,7.2rem)] font-semibold leading-[.87] tracking-[-.075em]">The reset that learns <span className="text-[#ff6f4f]">what works for you.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#a9bbb6] sm:text-lg">A six-pillar WQ check-in selects one coach-curated action, measures the shift, and improves the next recommendation—without turning your private moments into a data product.</p>
          </div>

          <div className="mt-10 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_1.25fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.16em] text-[#78908a]">WQ signal map</p><p className="mt-1 text-sm text-[#b8ff5c]">{result.confidence} profile</p></div><Database className="size-4 text-[#78908a]" /></div>
              <SignalMap signals={signals} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <p className="text-xs uppercase tracking-[.16em] text-[#78908a]">Compounding moat</p>
              <div className="mt-5 space-y-4"><MoatLine number="01" title="Framework" text="Six wellness pillars constrain the AI." /><MoatLine number="02" title="Fingerprint" text={`${outcomes.length} private outcomes shape the ranking.`} /><MoatLine number="03" title="Human loop" text="A coach-ready signal appears when AI is not enough." /></div>
            </div>
          </div>
        </section>

        <section className="order-1 self-start rounded-[2rem] border border-white/10 bg-[#0c2421]/95 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7 lg:order-2 lg:sticky lg:top-5">
          {!created ? <CheckInPanel checkIn={checkIn} update={update} onCreate={() => setCreated(true)} /> : <ResultPanel checkIn={checkIn} result={result} matchScore={matchScore} outcomes={outcomes} coachSignal={coachSignal} setCoachSignal={setCoachSignal} onAdjust={() => setCreated(false)} onStart={startGuided} />}
        </section>
      </div>

      <Dialog open={guided} onOpenChange={setGuided}>
        <DialogContent showCloseButton={!completed} className="max-w-xl overflow-hidden rounded-[2rem] border-white/10 bg-[#071b18] p-0 text-[#f4f4ec] shadow-2xl">
          {!completed ? <div className="p-6 sm:p-9">
            <DialogHeader><div className="mb-8 flex items-center justify-between text-sm text-[#93aaa4]"><span>{result.intervention.title}</span><span>{formatTime(secondsLeft)}</span></div><DialogTitle className="sr-only">Guided adaptive reset</DialogTitle><DialogDescription className="sr-only">Follow the current step until the timer completes.</DialogDescription></DialogHeader>
            <div className="mx-auto grid size-48 place-items-center rounded-full border border-[#b8ff5c]/20 bg-[radial-gradient(circle,rgba(184,255,92,.16),transparent_64%)] sm:size-60"><div className="pulse-orb grid size-32 place-items-center rounded-full bg-[#b8ff5c] text-center text-[#061816] shadow-[0_0_60px_rgba(184,255,92,.18)] sm:size-40"><div><p className="text-xs font-semibold uppercase tracking-[.18em] opacity-60">Step {activeStep + 1}</p><p className="mt-1 text-2xl font-semibold">{activeStep === 0 ? "Arrive" : activeStep === 1 ? "Shift" : "Choose"}</p></div></div></div>
            <p className="mx-auto mt-8 max-w-sm text-center text-xl font-medium leading-8">{result.intervention.steps[activeStep]}</p>
            <Progress value={timerProgress} className="mt-9 h-1.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#b8ff5c]" />
            <div className="mt-5 flex items-center justify-between"><button onClick={() => setSecondsLeft(totalSeconds)} className="flex items-center gap-2 text-sm text-[#93aaa4] hover:text-white"><RotateCcw className="size-4" />Restart</button><button onClick={finishReset} className="text-sm text-[#93aaa4] underline-offset-4 hover:text-white hover:underline">Finish early</button></div>
          </div> : <div className="p-6 sm:p-9">
            <DialogHeader><span className="mb-5 grid size-12 place-items-center rounded-full bg-[#b8ff5c] text-[#061816]"><Check /></span><DialogTitle className="text-4xl tracking-[-.05em]">Close the learning loop.</DialogTitle><DialogDescription className="mt-2 text-base leading-7 text-[#93aaa4]">Your response—not a generic wellness rule—teaches the next recommendation.</DialogDescription></DialogHeader>
            <div className="my-8 rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm">Mental load now</span><span className="text-3xl font-semibold text-[#b8ff5c]">{after}</span></div><Slider min={1} max={10} step={1} value={[after]} onValueChange={value => setAfter(value[0])} aria-label="Mental load after reset" className="[&_[data-slot=slider-range]]:bg-[#b8ff5c] [&_[data-slot=slider-thumb]]:border-[#b8ff5c]" /><div className="mt-3 flex justify-between text-xs text-[#667d77]"><span>Lighter</span><span>Still heavy</span></div></div>
            <div className="mb-4 grid grid-cols-3 gap-2 text-center"><Metric label="Before" value={checkIn.mentalLoad} /><Metric label="Now" value={after} accent /><Metric label="Shift" value={Math.max(0, checkIn.mentalLoad - after)} /></div>
            {after >= checkIn.mentalLoad && <div className="mb-4 rounded-xl border border-[#ff6f4f]/25 bg-[#ff6f4f]/10 p-4 text-sm leading-6 text-[#ffc2b5]">No shift is useful information. Minute Zero will lower this intervention’s rank and can prepare a concise signal for a trusted coach.</div>}
            <Button onClick={saveReflection} className="h-14 w-full rounded-xl bg-[#f4f4ec] text-base font-semibold text-[#061816] hover:bg-[#b8ff5c]">Teach my response fingerprint</Button>
            <p className="mt-3 text-center text-xs text-[#617872]">Saved only on this device. Demo outcomes are never persisted.</p>
          </div>}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CheckInPanel({ checkIn, update, onCreate }: { checkIn: CheckIn; update: <K extends keyof CheckIn>(key: K, value: CheckIn[K]) => void; onCreate: () => void }) {
  return <div>
    <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-sm text-[#93aaa4]">20-second WQ check-in</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Read the moment, not the person.</h2></div><span className="rounded-full border border-[#b8ff5c]/25 bg-[#b8ff5c]/10 px-3 py-1 text-xs text-[#b8ff5c]">Private</span></div>
    <div className="space-y-6"><CheckSlider label="Mental load" value={checkIn.mentalLoad} low="Spacious" high="Overloaded" onChange={value => update("mentalLoad", value[0])} /><CheckSlider label="Available energy" value={checkIn.energy} low="Running low" high="Fully charged" onChange={value => update("energy", value[0])} />
      <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Which pillar needs support?</p><button onClick={() => update("pillar", "choose")} className={`text-xs ${checkIn.pillar === "choose" ? "text-[#b8ff5c]" : "text-[#78908a] hover:text-white"}`}>Choose for me</button></div><div className="grid grid-cols-3 gap-2">{pillarOptions.map(({ id, short, icon: Icon }) => <button key={id} title={pillarOptions.find(item => item.id === id)?.label} onClick={() => update("pillar", id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs transition ${checkIn.pillar === id ? "border-[#b8ff5c] bg-[#b8ff5c] text-[#061816]" : "border-white/10 bg-white/[.025] text-[#a9bbb6] hover:border-white/25"}`}><Icon className="size-4" /><span>{short}</span></button>)}</div></div>
      <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Capacity available</p><span className="text-sm text-[#b8ff5c]">{checkIn.minutes} min</span></div><div className="grid grid-cols-4 gap-2">{[1,3,5,10].map(value => <button key={value} onClick={() => update("minutes", value as CheckIn["minutes"])} className={`rounded-xl border py-2.5 text-sm transition ${checkIn.minutes === value ? "border-[#ff6f4f] bg-[#ff6f4f] text-white" : "border-white/10 text-[#93aaa4] hover:border-white/25"}`}>{value}</button>)}</div></div>
    </div>
    <Button onClick={onCreate} className="mt-7 h-14 w-full rounded-xl bg-[#f4f4ec] text-base font-semibold text-[#061816] hover:bg-[#b8ff5c]">Find my highest-leverage reset <ArrowRight className="size-4" /></Button>
    {checkIn.mentalLoad >= 9 && <p className="mt-4 text-xs leading-5 text-[#93aaa4]">This is wellness guidance, not emergency or medical care. If you feel unsafe, contact local emergency support or someone you trust now.</p>}
  </div>;
}

function ResultPanel({ checkIn, result, matchScore, outcomes, coachSignal, setCoachSignal, onAdjust, onStart }: { checkIn: CheckIn; result: ReturnType<typeof recommend>; matchScore: number; outcomes: Outcome[]; coachSignal: boolean; setCoachSignal: (value: boolean) => void; onAdjust: () => void; onStart: () => void }) {
  const average = result.matches ? result.averageShift.toFixed(1) : "—";
  return <div className="flex min-h-[650px] flex-col">
    <div className="mb-6 flex items-center justify-between"><button onClick={onAdjust} className="text-sm text-[#93aaa4] hover:text-white">← Adjust check-in</button><span className="rounded-full border border-[#b8ff5c]/25 bg-[#b8ff5c]/10 px-3 py-1 text-xs text-[#b8ff5c]">{matchScore}% match</span></div>
    <div className="flex items-center gap-2 text-sm text-[#b8ff5c]"><Sparkles className="size-4" />WQ adaptive match · {result.pillar}</div>
    <h2 className="mt-3 text-5xl font-semibold tracking-[-.06em]">{result.intervention.title}</h2><p className="mt-3 max-w-md leading-7 text-[#a9bbb6]">{result.intervention.promise}</p>
    <div className="mt-6 grid grid-cols-3 gap-2">{result.reasons.map(reason => <div key={reason} className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-xs leading-5 text-[#9eb2ac]"><Check className="mb-2 size-3.5 text-[#b8ff5c]" />{reason}</div>)}</div>
    <ol className="my-7 space-y-4 border-y border-white/10 py-6">{result.intervention.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/15 text-xs text-[#b8ff5c]">{index + 1}</span><span className="pt-0.5 text-sm leading-6">{step}</span></li>)}</ol>
    <div className="grid grid-cols-3 gap-2"><Metric label="Past matches" value={result.matches} /><Metric label="Avg shift" value={average} accent /><Metric label="Local outcomes" value={outcomes.length} /></div>
    <button onClick={() => setCoachSignal(!coachSignal)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-[#a9bbb6] hover:border-white/25"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#b8ff5c]" />Preview human handoff</span><ChevronRight className={`size-4 transition ${coachSignal ? "rotate-90" : ""}`} /></button>
    {coachSignal && <div className="mt-2 rounded-xl border border-[#b8ff5c]/20 bg-[#b8ff5c]/[.06] p-4"><p className="text-xs uppercase tracking-[.14em] text-[#78908a]">Privacy-safe coach signal</p><p className="mt-2 text-sm leading-6">High {result.pillar} signal · load {checkIn.mentalLoad}/10 · energy {checkIn.energy}/10 · {checkIn.minutes}-minute capacity · best local response {average} points.</p><p className="mt-2 text-xs text-[#78908a]">No identity, journal text, or raw history. Nothing is sent automatically.</p></div>}
    <div className="mt-auto pt-6"><div className="mb-3 flex items-center gap-2 text-sm text-[#93aaa4]"><Clock3 className="size-4" />Designed for {checkIn.minutes} minute{checkIn.minutes === 1 ? "" : "s"}</div><Button onClick={onStart} className="h-14 w-full rounded-xl bg-[#b8ff5c] text-base font-semibold text-[#061816] hover:bg-[#cdfd8f]">Start adaptive reset <ArrowRight /></Button></div>
  </div>;
}

function CheckSlider({ label, value, low, high, onChange }: { label: string; value: number; low: string; high: string; onChange: (value: number[]) => void }) { return <div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium">{label}</label><span className="grid size-8 place-items-center rounded-full bg-white/5 text-sm text-[#b8ff5c]">{value}</span></div><Slider min={1} max={10} step={1} value={[value]} onValueChange={onChange} className="[&_[data-slot=slider-range]]:bg-[#b8ff5c] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-[#b8ff5c] [&_[data-slot=slider-thumb]]:bg-[#0c2421]" aria-label={label} /><div className="mt-2 flex justify-between text-xs text-[#667d77]"><span>{low}</span><span>{high}</span></div></div>; }
function Metric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) { return <div className={`rounded-xl p-3 text-center ${accent ? "bg-[#b8ff5c]/10" : "bg-white/5"}`}><p className="text-[11px] text-[#78908a]">{label}</p><p className={`mt-1 text-xl font-semibold ${accent ? "text-[#b8ff5c]" : ""}`}>{value}</p></div>; }
function MoatLine({ number, title, text }: { number: string; title: string; text: string }) { return <div className="grid grid-cols-[28px_90px_1fr] gap-2 text-sm"><span className="font-mono text-[#b8ff5c]">{number}</span><span className="font-medium">{title}</span><span className="text-[#78908a]">{text}</span></div>; }
function SignalMap({ signals }: { signals: Record<Pillar, number> }) {
  const entries = Object.entries(signals) as [Pillar, number][]; const center = 82; const radius = 55; const points = entries.map(([, value], index) => { const angle = -Math.PI / 2 + index * Math.PI / 3; const r = radius * value / 10; return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`; }).join(" "); const frame = entries.map((_, index) => { const angle = -Math.PI / 2 + index * Math.PI / 3; return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`; }).join(" ");
  return <div className="grid grid-cols-[164px_1fr] items-center gap-3"><svg viewBox="0 0 164 164" className="size-40" role="img" aria-label="Six pillar WQ signal map"><polygon points={frame} fill="none" stroke="rgba(255,255,255,.12)" /><polygon points={points} fill="rgba(184,255,92,.15)" stroke="#b8ff5c" strokeWidth="2" />{entries.map(([, value], index) => { const angle = -Math.PI / 2 + index * Math.PI / 3; return <circle key={index} cx={center + Math.cos(angle) * radius * value / 10} cy={center + Math.sin(angle) * radius * value / 10} r="3" fill="#ff6f4f" />; })}</svg><div className="space-y-1.5">{entries.map(([pillar, value]) => <div key={pillar} className="flex items-center justify-between gap-3 text-xs"><span className="capitalize text-[#78908a]">{pillar}</span><span>{value}/10</span></div>)}</div></div>;
}
function formatTime(seconds: number) { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${String(secs).padStart(2, "0")}`; }
