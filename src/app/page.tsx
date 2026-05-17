
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { VideoFeed } from "@/components/dashboard/video-feed";
import { SidebarPanels } from "@/components/dashboard/sidebar-panels";
import { EventTimeline } from "@/components/dashboard/event-timeline";
import {
  PaymentEvent,
  PaymentMethod,
  TrackedCustomer,
  ZoneDefinition as Zone,
  SystemLog,
} from "@/lib/types";
import { ObjectTracker } from "@/lib/tracker";
import { automatedPaymentMatcherFlow } from "@/ai/flows/automated-payment-matcher";
import { useArduino } from "@/hooks/use-arduino";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { Cpu, Target, ShieldCheck, Activity } from "lucide-react";

const INITIAL_ZONES: Zone[] = [
  { id: "z1", type: "billing", label: "Payment Counter", x: 5, y: 35, width: 22, height: 30, color: "#ef4444" },
  { id: "z2", type: "floor", label: "Sales Floor", x: 30, y: 10, width: 38, height: 80, color: "#f59e0b" },
  { id: "z3", type: "entry", label: "Entry Gate", x: 72, y: 10, width: 11, height: 80, color: "#10b981" },
  { id: "z4", type: "exit", label: "Exit Gate", x: 83, y: 10, width: 12, height: 80, color: "#06b6d4" },
];

export default function Dashboard() {
  const [customers, setCustomers] = useState<TrackedCustomer[]>([]);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isEditingZones, setIsEditingZones] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [fps, setFps] = useState(0);

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const trackerRef = useRef<ObjectTracker>(new ObjectTracker());
  const lastProcessTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const { 
    connect: connectArduino, 
    sendAlert, 
    status: arduinoStatus,
    isBlockedByPolicy
  } = useArduino();

  const addLog = useCallback((msg: string, type: SystemLog["type"] = "info", category: SystemLog["category"] = "SYSTEM", reasoning?: string, confidence?: number, trackerId?: string) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      category,
      message: msg,
      reasoning,
      confidence,
      trackerId
    }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        modelRef.current = await cocoSsd.load();
        setIsModelLoading(false);
        addLog("Neural Core v4.0 ONLINE", "success", "SYSTEM");
      } catch (e) {
        addLog("Neural Core Failure", "error", "SYSTEM");
      }
    }
    load();
  }, [addLog]);

  const handleFrame = useCallback(async (video: HTMLVideoElement) => {
    if (!modelRef.current || isModelLoading) return;
    const now = performance.now();
    if (now - lastProcessTimeRef.current < 100) return; // 10 FPS for stability
    lastProcessTimeRef.current = now;

    const start = performance.now();
    const preds = await modelRef.current.detect(video);
    const end = performance.now();
    setFps(Math.round(1000 / (end - start || 1)));

    const detections = preds.filter(p => p.class === "person").map(p => ({
      label: "person",
      confidence: p.score ?? 0,
      bbox: {
        x: (p.bbox[0] / video.videoWidth) * 100,
        y: (p.bbox[1] / video.videoHeight) * 100,
        width: (p.bbox[2] / video.videoWidth) * 100,
        height: (p.bbox[3] / video.videoHeight) * 100,
      }
    }));

    const updated = trackerRef.current.update(detections, zones);
    setCustomers(updated);
  }, [isModelLoading, zones]);

  // Security Auditor Logic
  useEffect(() => {
    const now = Date.now();
    customers.forEach(c => {
      const atExit = c.zone === "exit" && c.direction === "out";
      const confirmedTheft = c.hasItem && !c.paid && c.ownershipConfidence > 0.8;

      if (atExit && confirmedTheft && !c.alerted) {
        if (!c.theftConfirmedAt) {
          c.theftConfirmedAt = now;
          addLog(`[REVIEW] Staged exit detected for ${c.id}`, "warning", "EXIT", "Person approaching exit with confirmed items. Starting review timer.", 0.85, c.id);
          return;
        }

        if (now - c.theftConfirmedAt > 3000) { // 3s Confirmation Delay
          addLog(`[ALERT] UNPAID EXIT CONFIRMED: ${c.id}`, "alert", "EXIT", "Review timeout passed. Payment record not found for confirmed items.", 1.0, c.id);
          if (arduinoStatus === "CONNECTED") sendAlert();
          trackerRef.current.markAlerted(c.id);
        }
      } else if (atExit && !c.hasItem && !c.paid) {
        if (c.ownershipState !== "CLEARED_EXIT") {
          addLog(`[SAFE EXIT] ${c.id} cleared`, "success", "EXIT", "Person exiting with NO_ITEM state. Verification successful.", 1.0, c.id);
          c.ownershipState = "CLEARED_EXIT";
        }
      }
    });
  }, [customers, addLog, arduinoStatus, sendAlert]);

  const handlePayment = async (method: PaymentMethod) => {
    setIsProcessingPayment(true);
    const payId = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await new Promise(r => setTimeout(r, 1500));
    const result = await automatedPaymentMatcherFlow({ customers, paymentEvent: { method, referenceId: payId, confirmed: true }, zones });
    if (result.matchedCustomerId) {
      trackerRef.current.markPaid(result.matchedCustomerId, method);
      setCustomers(trackerRef.current.getSnapshot());
      addLog(`[PAYMENT] Auth Success: ${payId}`, "success", "PAYMENT", `Linked to ${result.matchedCustomerId} via neural matching.`, 0.98, result.matchedCustomerId);
    } else {
      addLog(`[PAYMENT] Ambiguous Match`, "warning", "PAYMENT", result.message);
    }
    setIsProcessingPayment(false);
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden font-body">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden min-h-0">
            <div className="flex-[2] relative rounded-[2.5rem] glass overflow-hidden shadow-2xl aura-border border-white/5">
              <VideoFeed
                customers={customers}
                zones={zones}
                onZoneChange={setZones}
                isEditingZones={isEditingZones}
                videoUrl={videoUrl}
                onFrame={handleFrame}
                isModelLoading={isModelLoading}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 glass px-8 py-5 rounded-2xl flex items-center justify-between shadow-xl aura-border">
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20"><Cpu className="w-6 h-6 text-accent animate-pulse" /></div>
                  <div><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Processor</span><span className="text-2xl font-code text-accent font-bold leading-none">{fps} FPS</span></div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20"><Target className="w-6 h-6 text-primary" /></div>
                  <div><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Neural Links</span><span className="text-2xl font-code text-foreground font-bold leading-none">{customers.length}</span></div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><ShieldCheck className="w-6 h-6 text-emerald-500" /></div>
                  <div><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Security</span><span className="text-2xl font-code text-emerald-400 font-bold leading-none">ACTIVE</span></div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <EventTimeline logs={logs} />
            </div>
          </div>

          <div className="w-full lg:w-[420px] flex flex-col gap-6 overflow-y-auto pr-2 hide-scrollbar">
            <SidebarPanels
              customers={customers}
              isEditingZones={isEditingZones}
              onToggleEditing={() => setIsEditingZones(!isEditingZones)}
              onSimulatePayment={handlePayment}
              isProcessing={isProcessingPayment}
              onVideoUpload={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoUrl(URL.createObjectURL(file));
                  trackerRef.current.reset();
                  startTimeRef.current = Date.now();
                }
              }}
              arduinoStatus={arduinoStatus}
              onConnectArduino={connectArduino}
              isBlockedByPolicy={isBlockedByPolicy}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
