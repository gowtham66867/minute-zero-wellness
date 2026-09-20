"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BatteryMedium, Brain, Check, Clock3, HeartPulse, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type Focus = "mind" | "body" | "energy" | "unsure";
const focusOptions: { id: Focus; label: string; icon: typeof Brain }[] = [
  { id: "mind", label: "Quiet my mind", icon: Brain },
  { id: "body", label: "Release tension", icon: Activity },
  { id: "energy", label: "Find some energy", icon: BatteryMedium },
  { id: "unsure", label: "Choose for me", icon: Sparkles },
];

export default function Home() {
  const [stress, setStress] = useState([6]);
  const [energy, setEnergy] = useState([4]);
  const [minutes, setMinutes] = useState(3);
  const [focus, setFocus] = useState<Focus>("unsure");
  const [created, setCreated] = useState(false);
  const [guided, setGuided] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [after, setAfter] = useState(6);
  const [resetCount, setResetCount] = useState(0);

  const plan = useMemo(() => {
    if (stress[0] >= 7) return { title: "Downshift", eyebrow: "Your quickest useful reset", detail: "Longer exhales first, then a gentle physical release.", steps: ["Six slow 4-in / 6-out breaths", "Drop your shoulders and unclench your jaw", "Name the next one thing—not the whole list"] };
    if (energy[0] <= 4 || focus === "energy") return { title: "Wake the system", eyebrow: "Low-friction energy", detail: "A short movement-and-light reset without pushing harder.", steps: ["Stand and reach overhead", "Take ten brisk steps or march in place", "Drink a few sips of water"] };
    return { title: "Clear the channel", eyebrow: "Protect your attention", detail: "Settle the noise and make the next action obvious.", steps: ["Look away from the screen", "Take four easy breaths", "Write your next single action"] };
  }, [stress, energy, focus]);

  const totalSeconds = minutes * 60;
  const elapsed = Math.max(0, totalSeconds - secondsLeft);
  const activeStep = Math.min(2, Math.floor(elapsed / Math.max(1, totalSeconds / 3)));
  const progress = totalSeconds ? (elapsed / totalSeconds) * 100 : 0;

  useEffect(() => {
    const saved = Number(localStorage.getItem("minute-zero-resets") || 0);
    setResetCount(saved);
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
      name: "configure_wellness_reset",
      title: "Configure wellness reset",
      description: "Configure the visible Minute Zero check-in and generate a matching wellness reset.",
      inputSchema: { type: "object", properties: { mentalLoad: { type: "integer", minimum: 1, maximum: 10 }, energy: { type: "integer", minimum: 1, maximum: 10 }, minutes: { type: "integer", enum: [1, 3, 5, 10] }, focus: { type: "string", enum: ["mind", "body", "energy", "unsure"] } }, required: ["mentalLoad", "energy", "minutes", "focus"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as { mentalLoad?: number; energy?: number; minutes?: number; focus?: Focus };
        if (!Number.isInteger(value.mentalLoad) || !Number.isInteger(value.energy) || ![1,3,5,10].includes(value.minutes || 0) || !["mind","body","energy","unsure"].includes(value.focus || "")) throw new Error("Invalid reset configuration");
        setStress([value.mentalLoad!]); setEnergy([value.energy!]); setMinutes(value.minutes!); setFocus(value.focus!); setCreated(true);
        return { status: "configured", minutes: value.minutes, visible: true };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function startGuided() { setSecondsLeft(totalSeconds); setCompleted(false); setAfter(Math.max(1, stress[0] - 1)); setGuided(true); }
  function finishReset() { setCompleted(true); setSecondsLeft(0); }
  function saveReflection() {
    const next = resetCount + 1;
    localStorage.setItem("minute-zero-resets", String(next));
    localStorage.setItem("minute-zero-latest", JSON.stringify({ before: stress[0], after, plan: plan.title, at: new Date().toISOString() }));
    setResetCount(next); setGuided(false); setCreated(false);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#061816] text-[#f4f4ec]">
      <div className="pointer-events-none fixed inset-0 opacity-70 [background:radial-gradient(circle_at_18%_12%,rgba(184,255,92,.13),transparent_26%),radial-gradient(circle_at_88%_76%,rgba(255,111,79,.12),transparent_30%)]" />
      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#b8ff5c] text-[#061816]"><HeartPulse className="size-5" strokeWidth={2.5} /></span><div><p className="text-lg font-semibold tracking-[-0.04em]">minute zero</p><p className="text-xs text-[#93aaa4]">reset before you restart</p></div></div>
        <div className="flex items-center gap-4 text-xs text-[#93aaa4]"><span className="hidden rounded-full border border-white/10 px-3 py-1.5 sm:inline">{resetCount} reset{resetCount === 1 ? "" : "s"} completed</span><span className="flex items-center gap-2"><LockKeyhole className="size-3.5" /><span className="hidden sm:inline">Stays on this device</span></span></div>
      </header>

      <div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 pb-10 pt-3 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] lg:px-12 lg:pb-16 lg:pt-8">
        <section className="order-2 flex flex-col justify-between lg:order-1 lg:min-h-[calc(100vh-140px)]">
          <div className="max-w-3xl">
            <div className="mb-8 flex items-center gap-3 text-sm text-[#b8ff5c]"><span className="h-px w-8 bg-current" /><span>20-second check-in</span></div>
            <h1 className="max-w-3xl text-[clamp(3.2rem,8vw,7.5rem)] font-semibold leading-[.86] tracking-[-.075em]">What do you need <span className="text-[#ff6f4f]">right now?</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#a9bbb6] sm:text-lg">No streaks. No life overhaul. Just one reset matched to the capacity you actually have.</p>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-white/10 py-5 text-sm">
            <div><span className="block text-2xl font-semibold text-[#b8ff5c]">01</span><span className="text-[#78908a]">Check in</span></div>
            <div><span className="block text-2xl font-semibold">02</span><span className="text-[#78908a]">Reset</span></div>
            <div><span className="block text-2xl font-semibold">03</span><span className="text-[#78908a]">Notice</span></div>
          </div>
        </section>

        <section className="order-1 self-start rounded-[2rem] border border-white/10 bg-[#0c2421]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7 lg:order-2 lg:sticky lg:top-6">
          {!created ? (
            <div>
              <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-sm text-[#93aaa4]">Let’s meet the moment</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">How are you arriving?</h2></div><span className="rounded-full border border-[#b8ff5c]/25 bg-[#b8ff5c]/10 px-3 py-1 text-xs text-[#b8ff5c]">Private</span></div>
              <div className="space-y-7">
                <CheckSlider label="Mental load" value={stress[0]} low="Spacious" high="Overloaded" onChange={setStress} />
                <CheckSlider label="Available energy" value={energy[0]} low="Running low" high="Fully charged" onChange={setEnergy} />
                <div><p className="mb-3 text-sm font-medium">What would help most?</p><div className="grid grid-cols-2 gap-2">{focusOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setFocus(id)} className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 text-left text-sm transition ${focus === id ? "border-[#b8ff5c] bg-[#b8ff5c] text-[#061816]" : "border-white/10 bg-white/[.025] text-[#bfd0cb] hover:border-white/25"}`}><Icon className="size-4" /><span>{label}</span>{focus === id && <Check className="ml-auto size-4" />}</button>)}</div></div>
                <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Time you have</p><span className="text-sm text-[#b8ff5c]">{minutes} min</span></div><div className="grid grid-cols-4 gap-2">{[1, 3, 5, 10].map(value => <button key={value} onClick={() => setMinutes(value)} className={`rounded-xl border py-2.5 text-sm transition ${minutes === value ? "border-[#ff6f4f] bg-[#ff6f4f] text-white" : "border-white/10 text-[#93aaa4] hover:border-white/25"}`}>{value}</button>)}</div></div>
              </div>
              <Button onClick={() => setCreated(true)} className="mt-7 h-14 w-full rounded-xl bg-[#f4f4ec] text-base font-semibold text-[#061816] hover:bg-[#b8ff5c]">Build my reset <ArrowRight className="size-4" /></Button>
            </div>
          ) : (
            <div className="flex min-h-[590px] flex-col">
              <button onClick={() => setCreated(false)} className="mb-9 self-start text-sm text-[#93aaa4] hover:text-white">← Adjust check-in</button>
              <div className="flex items-center gap-2 text-sm text-[#b8ff5c]"><Sparkles className="size-4" />{plan.eyebrow}</div><h2 className="mt-3 text-5xl font-semibold tracking-[-.06em]">{plan.title}</h2><p className="mt-4 max-w-md leading-7 text-[#a9bbb6]">{plan.detail}</p>
              <div className="my-8 h-px bg-white/10" /><ol className="space-y-5">{plan.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 text-sm text-[#b8ff5c]">{index + 1}</span><span className="pt-1 text-base leading-6">{step}</span></li>)}</ol>
              <div className="mt-auto pt-10"><div className="mb-3 flex items-center gap-2 text-sm text-[#93aaa4]"><Clock3 className="size-4" />Designed for {minutes} minute{minutes === 1 ? "" : "s"}</div><Button onClick={startGuided} className="h-14 w-full rounded-xl bg-[#b8ff5c] text-base font-semibold text-[#061816] hover:bg-[#cdfd8f]">Start guided reset <ArrowRight /></Button></div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={guided} onOpenChange={setGuided}>
        <DialogContent showCloseButton={!completed} className="max-w-xl overflow-hidden rounded-[2rem] border-white/10 bg-[#071b18] p-0 text-[#f4f4ec] shadow-2xl">
          {!completed ? <div className="p-6 sm:p-9">
            <DialogHeader><div className="mb-8 flex items-center justify-between text-sm text-[#93aaa4]"><span>{plan.title}</span><span>{formatTime(secondsLeft)}</span></div><DialogTitle className="sr-only">Guided reset</DialogTitle><DialogDescription className="sr-only">Follow the current step until the timer completes.</DialogDescription></DialogHeader>
            <div className="mx-auto grid size-48 place-items-center rounded-full border border-[#b8ff5c]/20 bg-[radial-gradient(circle,rgba(184,255,92,.16),transparent_64%)] sm:size-60"><div className="grid size-32 place-items-center rounded-full bg-[#b8ff5c] text-center text-[#061816] shadow-[0_0_60px_rgba(184,255,92,.18)] sm:size-40"><div><p className="text-xs font-semibold uppercase tracking-[.18em] opacity-60">Step {activeStep + 1}</p><p className="mt-1 text-2xl font-semibold">{activeStep === 0 ? "Arrive" : activeStep === 1 ? "Release" : "Choose"}</p></div></div></div>
            <p className="mx-auto mt-8 max-w-sm text-center text-xl font-medium leading-8">{plan.steps[activeStep]}</p>
            <Progress value={progress} className="mt-9 h-1.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#b8ff5c]" />
            <div className="mt-5 flex items-center justify-between"><button onClick={() => setSecondsLeft(totalSeconds)} className="flex items-center gap-2 text-sm text-[#93aaa4] hover:text-white"><RotateCcw className="size-4" />Restart</button><button onClick={finishReset} className="text-sm text-[#93aaa4] underline-offset-4 hover:text-white hover:underline">Finish early</button></div>
          </div> : <div className="p-6 sm:p-9">
            <DialogHeader><span className="mb-5 grid size-12 place-items-center rounded-full bg-[#b8ff5c] text-[#061816]"><Check /></span><DialogTitle className="text-4xl tracking-[-.05em]">Notice what changed.</DialogTitle><DialogDescription className="mt-2 text-base leading-7 text-[#93aaa4]">Not every reset has to fix everything. A small shift still counts.</DialogDescription></DialogHeader>
            <div className="my-8 rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm">Mental load now</span><span className="text-3xl font-semibold text-[#b8ff5c]">{after}</span></div><Slider min={1} max={10} step={1} value={[after]} onValueChange={value => setAfter(value[0])} aria-label="Mental load after reset" className="[&_[data-slot=slider-range]]:bg-[#b8ff5c] [&_[data-slot=slider-thumb]]:border-[#b8ff5c]" /><div className="mt-3 flex justify-between text-xs text-[#667d77]"><span>Lighter</span><span>Still heavy</span></div></div>
            <div className="mb-6 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-[#78908a]">Before</p><p className="mt-1 text-2xl font-semibold">{stress[0]}</p></div><div className="rounded-xl bg-[#b8ff5c]/10 p-4"><p className="text-xs text-[#78908a]">Now</p><p className="mt-1 text-2xl font-semibold text-[#b8ff5c]">{after}</p></div></div>
            <Button onClick={saveReflection} className="h-14 w-full rounded-xl bg-[#f4f4ec] text-base font-semibold text-[#061816] hover:bg-[#b8ff5c]">Save on this device</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatTime(seconds: number) { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${String(secs).padStart(2, "0")}`; }

function CheckSlider({ label, value, low, high, onChange }: { label: string; value: number; low: string; high: string; onChange: (value: number[]) => void }) {
  return <div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium">{label}</label><span className="grid size-8 place-items-center rounded-full bg-white/5 text-sm text-[#b8ff5c]">{value}</span></div><Slider min={1} max={10} step={1} value={[value]} onValueChange={onChange} className="[&_[data-slot=slider-range]]:bg-[#b8ff5c] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-[#b8ff5c] [&_[data-slot=slider-thumb]]:bg-[#0c2421]" aria-label={label} /><div className="mt-2 flex justify-between text-xs text-[#667d77]"><span>{low}</span><span>{high}</span></div></div>;
}
