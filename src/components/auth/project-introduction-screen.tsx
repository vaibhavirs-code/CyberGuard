"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Eye, Fingerprint, IndianRupee, Network, ShieldCheck, Sparkles, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectIntroductionScreenProps { onContinue: () => void; }

export const ProjectIntroductionScreen: React.FC<ProjectIntroductionScreenProps> = ({ onContinue }) => {
  const [boot, setBoot] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setBoot((v) => Math.min(v + 1, 100)), 18);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02050b] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:"linear-gradient(rgba(0,220,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,255,.07) 1px,transparent 1px)",backgroundSize:"48px 48px"}} />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-7 md:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/5">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
              <span className="absolute inset-0 rounded-xl border border-cyan-300/20 animate-ping" />
            </div>
            <div><p className="font-code text-[9px] font-black uppercase tracking-[.3em] text-cyan-300">NITK · Build for Billions</p><p className="mt-1 text-[8px] uppercase tracking-[.22em] text-white/35">Digital trust infrastructure for Bharat</p></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-2 md:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/><span className="font-code text-[9px] uppercase tracking-widest text-white/50">Prototype online · {boot}%</span></div>
        </header>

        <section className="grid items-center gap-12 py-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-12 bg-cyan-300"/><p className="text-[9px] font-black uppercase tracking-[.4em] text-cyan-300">India-first AI retail security</p></div>
            <h1 className="font-headline text-6xl font-black uppercase leading-[.88] tracking-[-.04em] md:text-8xl">Cyber<span className="text-cyan-300">Guard</span><br/><span className="text-white/20">Vision</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 md:text-lg">A privacy-aware AI layer that connects <span className="text-white">camera intelligence</span>, <span className="text-white">temporary customer tracking</span>, <span className="text-white">basket reconstruction</span> and <span className="text-white">payment verification</span> into one explainable retail trust workflow.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["UPI · QR · POS · Cash","₹ INR","English · हिंदी","No facial identity"].map((x)=><span key={x} className="rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-[8px] font-bold uppercase tracking-widest text-white/60">{x}</span>)}
            </div>
            <Button onClick={onContinue} className="mt-9 h-14 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-8 text-[10px] font-black uppercase tracking-[.28em] text-cyan-200 hover:bg-cyan-300/20">Initialize Secure Demo <ArrowRight className="ml-3 h-4 w-4"/></Button>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute inset-10 rounded-full border border-cyan-300/10 animate-pulse"/>
            <div className="absolute inset-16 rounded-full border border-violet-400/10"/>
            <div className="relative aspect-square rounded-[3rem] border border-cyan-300/20 bg-black/40 p-7 shadow-[0_0_80px_rgba(0,220,255,.08)] backdrop-blur-xl">
              <div className="flex h-full flex-col items-center justify-center rounded-[2.3rem] border border-white/10 bg-gradient-to-br from-cyan-300/[.06] to-violet-400/[.04]">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-cyan-300/40 bg-cyan-300/5 shadow-[0_0_60px_rgba(0,220,255,.18)]">
                  <Fingerprint className="h-16 w-16 text-cyan-300"/>
                  <span className="absolute inset-3 rounded-[1.4rem] border border-cyan-300/20 animate-ping"/>
                </div>
                <p className="mt-7 font-headline text-2xl font-black uppercase tracking-[.18em]">CYBERGUARD</p>
                <p className="mt-2 font-code text-[8px] uppercase tracking-[.32em] text-cyan-300">SEE · TWIN · VERIFY · ACT</p>
                <div className="mt-8 grid w-full grid-cols-3 gap-2 px-6">
                  {[[Eye,"SEE"],[IndianRupee,"VERIFY"],[Network,"DPI"]].map(([Icon,label])=>{const I=Icon as typeof Eye; return <div key={label as string} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-center"><I className="mx-auto h-4 w-4 text-cyan-300"/><p className="mt-2 text-[7px] font-bold uppercase tracking-widest text-white/40">{label as string}</p></div>})}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="grid gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.2em] text-white/30 md:grid-cols-4">
          <span><Sparkles className="mr-2 inline h-3 w-3 text-cyan-300"/>AI-assisted decision support</span>
          <span><Store className="mr-2 inline h-3 w-3 text-cyan-300"/>Indian retail ready</span>
          <span><Zap className="mr-2 inline h-3 w-3 text-cyan-300"/>Multi-frame evidence</span>
          <span><ShieldCheck className="mr-2 inline h-3 w-3 text-cyan-300"/>Human review in loop</span>
        </footer>
      </div>
    </main>
  );
};
