"use client";

import { CheckCircle2, CircleDollarSign, Play, ShieldCheck, X, Zap } from "lucide-react";

interface JudgeDemoPanelProps { onClose: () => void; }

const steps = [
  ["01", "C07 enters", "Temporary ID created from multi-frame person tracking"],
  ["02", "Basket reconstructed", "Amul Milk ₹32 + Maggi ₹15 + Parle-G ₹10 = ₹57"],
  ["03", "UPI event received", "Simulated payment event: ₹47 · UPI"],
  ["04", "Consistency check", "Expected ₹57 vs paid ₹47 → AMOUNT MISMATCH"],
  ["05", "Human review", "CCTV evidence + timeline are surfaced for review"],
];

export function JudgeDemoPanel({ onClose }: JudgeDemoPanelProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-accent/30 bg-[#050b12] shadow-[0_0_100px_rgba(0,220,255,.12)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" /><p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-200">Simulated Judge Demo</p></div>
            <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">C07 · Transaction Twin Story</h2>
            <p className="mt-1 text-[10px] text-white/40">Demo data only · does not modify live CCTV, tracker, payment, or DPI records.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close judge demo"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-2">
            {steps.map(([number, title, detail], index) => (
              <div key={number} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
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
              {[["Customer","C07"],["Zone","Checkout"],["Basket","₹57"],["Payment","₹47 · UPI"],["Result","AMOUNT MISMATCH"]].map(([label,value]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3"><span className="text-[8px] font-bold uppercase tracking-widest text-white/35">{label}</span><span className={label === "Result" ? "font-code text-[9px] font-black text-amber-200" : "font-code text-[9px] font-bold text-white/80"}>{value}</span></div>)}
            </div>
            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3"><p className="text-[8px] font-black uppercase tracking-widest text-amber-200">Explainable outcome</p><p className="mt-2 text-[9px] leading-5 text-white/55">The reconstructed basket and payment event disagree by ₹10. This is a transaction inconsistency signal, not a finding of guilt.</p></div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <p className="text-[8px] uppercase tracking-widest text-white/30">For presentation only · simulated scenario</p>
          <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-accent hover:bg-accent/20"><Play className="h-3.5 w-3.5" /> Close & return to console</button>
        </div>
      </div>
    </div>
  );
}
