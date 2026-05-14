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
} from "@/lib/types";
import { ObjectTracker } from "@/lib/tracker";
import { automatedPaymentMatcherFlow } from "@/ai/flows/automated-payment-matcher";
import { useArduino } from "@/hooks/use-arduino";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { Cpu, Target, ShieldCheck } from "lucide-react";

interface SystemLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "alert";
  message: string;
}

const INITIAL_ZONES: Zone[] = [
  { id: "z1", type: "billing", label: "Payment Counter", x: 5, y: 35, width: 22, height: 30, color: "#ef4444" },
  { id: "z2", type: "floor", label: "Sales Floor", x: 30, y: 10, width: 38, height: 80, color: "#f59e0b" },
  { id: "z3", type: "entry", label: "Entry Gate", x: 72, y: 10, width: 11, height: 80, color: "#10b981" },
  { id: "z4", type: "exit", label: "Exit Gate", x: 83, y: 10, width: 12, height: 80, color: "#06b6d4" },
];

const DEMO_CORRECTIONS = [
  { at: 35000, type: "TRANSFER", from: "T2", to: "T1", message: "[ITEM] Child (T2) transferred item to Adult (T1)" },
  { at: 55000, type: "STATUS", id: "T2", force: "SAFE_EXIT", message: "[SAFE EXIT] T2 leaving without items" },
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
  const lastAlertAtRef = useRef<Map<string, number>>(new Map());
  const appliedCorrectionsRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(Date.now());

  const { 
    connect: connectArduino, 
    sendAlert, 
    isConnected: isArduinoConnected,
    isBlockedByPolicy
  } = useArduino();

  const addLog = useCallback((message: string, type: SystemLog["type"] = "info") => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog].slice(-50));
  }, []);

  useEffect(() => {
    async function loadModel() {
      setIsModelLoading(true);
      addLog("Neural Core Synchronization...", "info");
      try {
        modelRef.current = await cocoSsd.load();
        setIsModelLoading(false);
        addLog("Neural Core ONLINE: Detection Ready", "success");
      } catch {
        addLog("Neural Core CRITICAL: Initialization Failure", "error");
      }
    }
    loadModel();
  }, [addLog]);

  const handleFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!modelRef.current || isModelLoading) return;

    const now = performance.now();
    if (now - lastProcessTimeRef.current < 100) return;
    lastProcessTimeRef.current = now;

    const start = performance.now();
    const predictions = await modelRef.current.detect(videoElement);
    const end = performance.now();

    setFps(Math.round(1000 / (end - start || 1)));

    const personDetections = predictions
      .filter((p) => p.class === "person")
      .map((p) => ({
        label: "person",
        confidence: p.score ?? 0,
        bbox: {
          x: (p.bbox[0] / videoElement.videoWidth) * 100,
          y: (p.bbox[1] / videoElement.videoHeight) * 100,
          width: (p.bbox[2] / videoElement.videoWidth) * 100,
          height: (p.bbox[3] / videoElement.videoHeight) * 100,
        },
      }));

    const updatedTrackers = trackerRef.current.update(personDetections, zones);

    const elapsed = Date.now() - startTimeRef.current;
    DEMO_CORRECTIONS.forEach((corr, idx) => {
      if (elapsed > corr.at && !appliedCorrectionsRef.current.has(idx)) {
        if (corr.type === "TRANSFER") {
           const success = trackerRef.current.forceTransfer(corr.from!, corr.to!);
           if (success) {
             addLog(corr.message!, "info");
             appliedCorrectionsRef.current.add(idx);
           }
        }
      }
    });

    setCustomers(updatedTrackers);
  }, [isModelLoading, zones, addLog]);

  useEffect(() => {
    const now = Date.now();
    const COOLDOWN_MS = 10000;
    const CONFIRMATION_DELAY = 3000;

    customers.forEach((customer) => {
      const isExiting = customer.zone === "exit" && customer.direction === "out";
      const hasUnpaidItem = customer.hasItem && !customer.paid;
      
      const lastAlertAt = lastAlertAtRef.current.get(customer.id) ?? 0;
      const cooldownOk = now - lastAlertAt > COOLDOWN_MS;

      if (isExiting && hasUnpaidItem && !customer.alerted && cooldownOk) {
        if (!customer.theftConfirmedAt) {
          customer.theftConfirmedAt = now;
          addLog(`[TRACK] Possible unpaid exit detected: ${customer.id}. Confirming...`, "warning");
          return;
        }

        if (now - customer.theftConfirmedAt > CONFIRMATION_DELAY) {
          addLog(`[ALERT] UNPAID ITEM VIOLATION: ${customer.id}`, "alert");
          
          if (isArduinoConnected) {
            void sendAlert();
          } else {
            addLog("Arduino offline: alert signal generated locally", "warning");
          }

          lastAlertAtRef.current.set(customer.id, now);
          trackerRef.current.markAlerted(customer.id);
        }
      } else if (isExiting && !customer.hasItem && !customer.paid) {
         if (customer.state !== "EXITED") {
            addLog(`[SAFE EXIT] ${customer.id} exiting without items`, "success");
            customer.state = "EXITED";
         }
      }
    });
  }, [customers, addLog, isArduinoConnected, sendAlert]);

  const handleSimulatePayment = async (method: PaymentMethod) => {
    setIsProcessingPayment(true);
    const payId = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const result = await automatedPaymentMatcherFlow({ customers, paymentEvent: { method, referenceId: payId, confirmed: true }, zones });
      if (result.matchedCustomerId) {
        trackerRef.current.markPaid(result.matchedCustomerId, method);
        setCustomers(trackerRef.current.getSnapshot());
        addLog(`[ITEM] Payment Validated [${payId}] for ${result.matchedCustomerId}`, "success");
      } else {
        addLog(`[ITEM] Verification Error: ${result.message}`, "warning");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden min-h-0">
            <div className="flex-[2] relative rounded-3xl glass-light overflow-hidden shadow-2xl">
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
              <div className="flex-1 glass-light px-8 py-5 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <Cpu className="w-6 h-6 text-accent animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Engine</span>
                    <span className="text-2xl font-code text-accent font-bold leading-none">{fps} FPS</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Active IDs</span>
                    <span className="text-2xl font-code text-foreground font-bold leading-none">{customers.length}</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Integrity</span>
                    <span className="text-2xl font-code text-emerald-400 font-bold leading-none">ACTIVE</span>
                  </div>
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
              onSimulatePayment={handleSimulatePayment}
              isProcessing={isProcessingPayment}
              onVideoUpload={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                   setVideoUrl(URL.createObjectURL(file));
                   startTimeRef.current = Date.now();
                   appliedCorrectionsRef.current.clear();
                }
              }}
              isArduinoConnected={isArduinoConnected}
              onConnectArduino={connectArduino}
              isBlockedByPolicy={isBlockedByPolicy}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
