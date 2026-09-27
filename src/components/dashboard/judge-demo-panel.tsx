"use client";

import React, { useCallback, useState } from "react";
import { CheckCircle2, CircleDollarSign, Play, ShieldCheck, X, Zap, Volume2, Camera } from "lucide-react";

interface JudgeDemoPanelProps { onClose: () => void; }

const steps = [
  ["01", "C07 enters", "Temporary ID created from multi-frame person tracking"],
  ["02", "Basket reconstructed", "Amul Milk ₹32 + Maggi ₹15 + Parle-G ₹10 = ₹57"],
  ["03", "UPI event received", "Simulated payment event: ₹47 · UPI"],
  ["04", "Consistency check", "Expected ₹57 vs paid ₹47 → AMOUNT MISMATCH"],
  ["05", "Human review", "CCTV evidence + timeline are surfaced for review"],
];

export function JudgeDemoPanel({ onClose }: JudgeDemoPanelProps) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const beep = useCallback(() => {
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 5);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 5);
      window.setTimeout(() => void audio.close(), 5200);
    } catch {}
  }, []);

  const makeSnapshot = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(20,30,40,0.8)";
    ctx.fillRect(70, 90, 820, 390);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 6;
    ctx.strokeRect(320, 130, 270, 300);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(320, 92, 340, 38);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("HIGH RISK · C07 · 95%", 335, 118);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("SIMULATED CCTV EVIDENCE", 30, 35);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
  }, []);

  const runSimulation = useCallback(() => {
    if (running) return;
    setRunning(true);
    setStep(0);
    setSnapshot(null);
    beep();

    [900, 1800, 2700, 3600, 4500].forEach((delay, index) => {
      window.setTimeout(() => {
        setStep(index);
        if (index === 4) {
          makeSnapshot();
          setRunning(false);
        }
      }, delay);
    });
  }, [beep, makeSnapshot, running]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2rem] border border-accent/30 bg-[#050b12] shadow-[0_0_100px_rgba(0,220,255,.12)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" /><p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-200">Simulated Judge Demo</p></div>
            <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">C07 · Transaction Twin Story</h2>
            <p className="mt-1 text-[10px] text-white/40">Demo data only · does not modify live CCTV, tracker, payment, or DPI records.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" disabled={running} onClick={runSimulation} className="flex items-center gap-2 rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-red-100 shadow-[0_0_24px_rgba(239,68,68,.12)] hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40">
                <Volume2 className="h-3.5 w-3.5" /> {running ? "Alert test running…" : "Test beep + snapshot"}
              </button>
              <span className="rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-2 text-[8px] font-bold uppercase tracking-widest text-red-200/80">Reliable simulated test</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close judge demo"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-2">
            {steps.map(([number, title, detail], index) => (
              <div key={number} className={`flex gap-4 rounded-2xl border p-4 transition ${step === index ? "border-red-400/40 bg-red-400/10" : "border-white/10 bg-white/[0.025]"}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 font-code text-[9px] font-black text-accent">{number}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">{index < 4 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <CircleDollarSign className="h-3.5 w-3.5 text-violet-300" />}<p className="text-[10px] font-black uppercase tracking-widest text-white">{title}</p></div>
                  <p className="mt-1 text-[9px] leading-5 text-white/45">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /><p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Expected judge view</p></div>
            <div className="mt-5 space-y-3">
              {[[ "Customer","C07" ],[ "Zone","Checkout" ],[ "Basket","₹57" ],[ "Payment","₹47 · UPI" ],[ "Result","AMOUNT MISMATCH" ]].map(([label,value]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3"><span className="text-[8px] font-bold uppercase tracking-widest text-white/35">{label}</span><span className={label === "Result" ? "font-code text-[9px] font-black text-amber-200" : "font-code text-[9px] font-bold text-white/80"}>{value}</span></div>)}
            </div>
          </div>
        </div>

        <div className="mx-6 mb-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-red-200"><Volume2 className="h-3.5 w-3.5" /> Alert test details</p>
              <p className="mt-1 text-[9px] text-white/45">Runs a controlled C07 suspicious-event sequence and produces the operator beep plus a simulated evidence frame.</p>
            </div>
            <button type="button" disabled={running} onClick={runSimulation} className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-red-100 disabled:opacity-40">
              <Play className="h-3.5 w-3.5" /> {running ? "Simulation running…" : "Test beep + snapshot"}
            </button>
          </div>
          {step >= 0 && <p className="mt-3 text-[8px] font-code uppercase tracking-widest text-amber-200">Simulation step {step + 1}/5 · {steps[step][1]}</p>}
          {snapshot && <div className="mt-3 flex items-center gap-3 rounded-xl border border-red-400/20 bg-black/30 p-2"><img src={snapshot} alt="Simulated high-risk CCTV evidence" className="h-20 w-32 rounded-lg object-cover" /><span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-red-200"><Camera className="h-3.5 w-3.5" /> Snapshot generated</span></div>}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <p className="text-[8px] uppercase tracking-widest text-white/30">For presentation only · simulated scenario</p>
          <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-accent hover:bg-accent/20"><Play className="h-3.5 w-3.5" /> Close & return to console</button>
        </div>
      </div>
    </div>
  );
}
