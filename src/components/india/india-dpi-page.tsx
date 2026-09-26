"use client";

import { ArrowLeft, ArrowRight, BrainCircuit, Languages, Network, QrCode, ShieldCheck, Store } from "lucide-react";

export function IndiaDpiPage({ onBack, onOpenDashboard }: { onBack: () => void; onOpenDashboard: () => void }) {
  const pillars = [
    { icon: QrCode, title: "UPI-first payments", text: "Connect transaction verification to UPI, QR, POS, card and cash states without exposing a real customer identity." },
    { icon: BrainCircuit, title: "AI Transaction Twin", text: "Reconstruct a temporary customer journey from multi-frame CCTV, products, zones and payment events." },
    { icon: Network, title: "Open ecosystem layer", text: "CyberGuard is designed as an application layer that can interoperate with India's digital payment ecosystem — not as a government database." },
  ];
  const signals = [["SEE","Anonymous vision"],["TWIN","Basket reconstruction"],["VERIFY","Payment consistency"],["ACT","Human review"]];
  return (
    <main className="min-h-screen overflow-y-auto bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-accent"><ShieldCheck className="h-5 w-5" /> CyberGuard · India Digital Trust</div>
          <button onClick={onOpenDashboard} className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-accent">Live Console <ArrowRight className="h-4 w-4" /></button>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[2.5rem] border border-accent/20 bg-gradient-to-br from-accent/10 via-white/[0.03] to-violet-500/10 p-8 md:p-14">
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-accent">NITK Build for Billions · India</p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-7xl">From CCTV<br/><span className="text-accent">to Digital Trust.</span></h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60 md:text-base">CyberGuard turns fragmented retail signals into an explainable trust workflow: observe anonymously, reconstruct the basket, verify the payment event, and route uncertainty to a human.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest">₹ INR native</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest">UPI · QR · POS · Cash</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest">English · हिंदी · ಕನ್ನಡ</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {signals.map(([a,b])=><div key={a} className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl"><p className="font-code text-2xl font-black text-accent">{a}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50">{b}</p><div className="mt-5 h-1 rounded-full bg-white/10"><div className="h-full w-4/5 rounded-full bg-accent"/></div></div>)}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {pillars.map(({icon:Icon,title,text})=><article key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 hover:border-accent/30 transition"><Icon className="h-6 w-6 text-accent"/><h2 className="mt-4 text-sm font-black uppercase tracking-widest">{title}</h2><p className="mt-3 text-xs leading-6 text-white/50">{text}</p></article>)}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 lg:col-span-2">
            <div className="flex items-center gap-2"><Store className="h-4 w-4 text-amber-300"/><h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Indian retail demo profile</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[["Store","Mangaluru Smart Retail Demo"],["Region","Karnataka · India"],["Checkout","UPI / QR / POS / Cash"],["Currency","Indian Rupee · ₹"],["Language","English / हिंदी / ಕನ್ನಡ"],["Identity","Temporary IDs only"]].map(([k,v])=><div key={k} className="rounded-xl border border-white/5 bg-black/20 p-4"><p className="text-[8px] uppercase tracking-widest text-white/35">{k}</p><p className="mt-2 text-xs font-bold text-white/80">{v}</p></div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
            <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-accent"/><h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Designed for Bharat</h2></div>
            <p className="mt-4 text-xs leading-6 text-white/60">The same trust workflow can be surfaced in English, Hindi or Kannada, while the operator view keeps the underlying event structure consistent.</p>
            <div className="mt-6 space-y-2 text-[10px] font-bold"><div className="rounded-xl bg-black/20 p-3">English · Transaction verified</div><div className="rounded-xl bg-black/20 p-3">हिंदी · लेनदेन सत्यापित</div><div className="rounded-xl bg-black/20 p-3">ಕನ್ನಡ · ವಹಿವಾಟು ಪರಿಶೀಲಿಸಲಾಗಿದೆ</div></div>
          </div>
        </section>

        <footer className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-[9px] leading-5 text-white/40"><span className="font-bold text-white/60">Judge note:</span> CyberGuard demonstrates interoperability concepts around India's digital-first payment environment. It does not claim direct access to Aadhaar, government databases, or live government infrastructure.</footer>
      </div>
    </main>
  );
}
