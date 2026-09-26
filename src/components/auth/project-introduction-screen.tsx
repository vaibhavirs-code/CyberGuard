"use client";

import React from "react";
import { ArrowRight, Eye, ShieldCheck, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectIntroductionScreenProps {
  onContinue: () => void;
}

export const ProjectIntroductionScreen: React.FC<ProjectIntroductionScreenProps> = ({ onContinue }) => {
  return (
    <main className="min-h-screen overflow-y-auto bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10">
            <ShieldCheck className="h-7 w-7 text-accent" />
          </div>
          <div>
            <p className="font-code text-xs font-bold uppercase tracking-[0.35em] text-accent">NITK Build for Billions 2026</p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">Reinvent Digital Public Infrastructure for Billions</p>
          </div>
        </div>

        <section className="glass aura-border rounded-[2rem] border border-primary/20 bg-black/40 p-8 md:p-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-primary">Working MVP / Prototype</p>
          <h1 className="font-headline text-4xl font-black uppercase tracking-[0.12em] md:text-6xl">
            CyberGuard <span className="text-primary glow-text">Vision</span>
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-muted-foreground">
            A privacy-aware retail safety and loss-prevention platform that connects camera intelligence,
            customer-item tracking, payment matching, risk alerts and evidence capture in one operator dashboard.
          </p>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Eye className="mb-3 h-6 w-6 text-accent" />
              <h2 className="font-bold uppercase tracking-wider">Observe</h2>
              <p className="mt-2 text-sm text-muted-foreground">Track movement, zones and item interactions from camera feeds.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Zap className="mb-3 h-6 w-6 text-primary" />
              <h2 className="font-bold uppercase tracking-wider">Understand</h2>
              <p className="mt-2 text-sm text-muted-foreground">Combine behavioral signals, payment state and uncertainty into explainable risk signals.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Store className="mb-3 h-6 w-6 text-emerald-300" />
              <h2 className="font-bold uppercase tracking-wider">Respond</h2>
              <p className="mt-2 text-sm text-muted-foreground">Surface alerts, preserve privacy-aware evidence and support operator action.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Problem</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Retail teams need a way to turn fragmented CCTV observation and payment information into timely,
                explainable safety signals without relying on facial identification.
              </p>
            </div>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Prototype impact</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The MVP demonstrates an operator workflow that can scale from a single camera to multi-camera
                monitoring while keeping identity masking and human review in the loop.
              </p>
            </div>
          </div>

          <Button onClick={onContinue} className="mt-9 h-14 w-full rounded-2xl text-sm font-bold uppercase tracking-[0.3em] md:w-auto md:px-10">
            Enter Live Demo <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </section>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          AI signals are decision support, not proof • Identity-aware privacy controls
        </p>
      </div>
    </main>
  );
};
