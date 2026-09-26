"use client";

import { ArrowLeft, CircleAlert, Clock3, CreditCard, Eye, Package, ShieldCheck } from "lucide-react";
import type { CameraFeedState, TransactionTwinResult } from "@/lib/types";
import { buildTransactionTwin } from "@/services/transaction-twin";

const stateStyles: Record<TransactionTwinResult["state"], string> = {
  VERIFIED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "AMOUNT MISMATCH": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "PAYMENT FAILED": "border-red-400/30 bg-red-400/10 text-red-200",
  "PAYMENT PENDING": "border-blue-400/30 bg-blue-400/10 text-blue-200",
  "NO PAYMENT": "border-red-400/30 bg-red-400/10 text-red-200",
  "AMBIGUOUS/REVIEW REQUIRED": "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

export function TransactionTwinPanel({ camera, customerId, onClose }: { camera: CameraFeedState; customerId: string; onClose: () => void }) {
  const customer = camera.customers.find((item) => item.id === customerId);
  if (!customer) return null;
  const twin = buildTransactionTwin(camera, customer);
  const products = camera.detectedProducts.filter((product) => product.associatedPersonId === customer.id && product.state !== "lost_tracking");
  const linkedEvidence = camera.evidenceSnapshots.filter((item) => item.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-accent/20 bg-[#07101c] p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-white/70 hover:bg-white/10" aria-label="Close transaction twin"><ArrowLeft className="h-4 w-4" /></button>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-accent">CyberGuard · Transaction Twin</p>
              <h2 className="mt-1 text-xl font-black text-white">Temporary Customer ID · {customer.id}</h2>
              <p className="text-[10px] text-white/50">Anonymous operational identifier · not a real-world identity</p>
            </div>
          </div>
          <div className={"rounded-full border px-4 py-2 text-[10px] font-black tracking-[0.18em] " + stateStyles[twin.state]}>{twin.state}</div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {[
            ["Detection confidence", Math.round(twin.detectionConfidence * 100) + "%", "Model signal"],
            ["Tracking stability", Math.round(twin.trackingStability * 100) + "%", customer.framesSeen + " frames"],
            ["Consistency score", Math.round(twin.transactionConsistencyScore * 100) + "%", "Not a probability"],
            ["Current zone", customer.zone.toUpperCase(), customer.state.replaceAll("_", " ")],
          ].map(([label, value, detail]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-[8px] uppercase tracking-widest text-white/40">{label}</p><p className="mt-2 font-code text-lg font-black text-white">{value}</p><p className="mt-1 text-[9px] text-white/50">{detail}</p></div>)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-amber-300" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Reconstructed basket</h3></div>
            <div className="mt-3 space-y-2">
              {products.length ? products.map(product => <div key={product.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-[10px]"><span className="text-white/80">{product.name} <span className="text-white/35">({product.id})</span></span><span className="font-code text-white">₹{product.unitPrice.toFixed(2)}</span></div>) : <p className="text-[10px] text-white/40">No directly associated product tracks available.</p>}
            </div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-code text-sm font-black text-white"><span>Basket total</span><span>₹{twin.expectedAmount.toFixed(2)}</span></div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-cyan-300" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Related payment event</h3></div>
            <div className="mt-3 space-y-2 text-[10px]">
              <div className="flex justify-between"><span className="text-white/40">State</span><span className="font-bold text-white">{customer.paymentState.toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Method</span><span className="font-bold text-white">{customer.paymentMethod?.toUpperCase() ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Reference</span><span className="font-code text-white">{customer.paymentReferenceId ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="font-code text-white">{twin.paymentAmount !== undefined ? "₹" + twin.paymentAmount.toFixed(2) : "Not supplied"}</span></div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-300" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Customer journey timeline</h3></div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{twin.timeline.map((event, index) => <div key={String(event.at) + "-" + index} className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-widest text-accent">{new Date(event.at).toLocaleTimeString()}</p><p className="mt-1 text-[10px] font-bold text-white">{event.label}</p><p className="mt-1 text-[9px] text-white/45">{event.detail}</p></div>)}</div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Explainable verification</h3></div><ul className="mt-3 space-y-2">{twin.reasons.map(reason => <li key={reason} className="text-[10px] leading-5 text-white/65">• {reason}</li>)}</ul></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2"><Eye className="h-4 w-4 text-cyan-300" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Linked CCTV evidence</h3></div><div className="mt-3 grid grid-cols-2 gap-2">{linkedEvidence.map(snapshot => <img key={snapshot.id} src={snapshot.dataUrl} alt={"CCTV evidence " + snapshot.id} className="aspect-video rounded-xl border border-white/10 object-cover" />)}{linkedEvidence.length===0 && <p className="col-span-2 text-[10px] text-white/40">No stored evidence snapshot is linked to this customer yet.</p>}</div></div>
        </section>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-[9px] text-white/45"><CircleAlert className="h-4 w-4 text-amber-300" />Detection confidence, tracking stability and transaction consistency are separate signals. The consistency score is an evidence-consistency measure, not a probability of theft or guilt.</div>
      </div>
    </div>
  );
}
