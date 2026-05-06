
"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { VideoFeed } from '@/components/dashboard/video-feed';
import { SidebarPanels } from '@/components/dashboard/sidebar-panels';
import { EventTimeline } from '@/components/dashboard/event-timeline';
import { AnimatedBackground } from '@/components/dashboard/animated-background';
import { Zone, TrackedCustomer, SystemLog } from '@/lib/types';
import { ObjectTracker } from '@/lib/tracker';
import { automatedPaymentMatcher } from '@/ai/flows/automated-payment-matcher';
import { useToast } from '@/hooks/use-toast';
import { useArduino } from '@/hooks/use-arduino';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Activity, Target, Cpu, ShieldCheck } from 'lucide-react';

const INITIAL_ZONES: Zone[] = [
  { id: 'z1', type: 'entry-exit', label: 'Entry/Exit Path', x: 5, y: 10, width: 25, height: 80, color: '#10b981' }, // Green/Emerald
  { id: 'z2', type: 'billing', label: 'Payment Counter', x: 45, y: 40, width: 30, height: 35, color: '#ef4444' }, // Red
  { id: 'z3', type: 'shopping', label: 'Sales Floor', x: 30, y: 10, width: 65, height: 80, color: '#f59e0b' }, // Amber
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
  const { toast } = useToast();
  const { connect: connectArduino, sendAlert, isConnected: isArduinoConnected } = useArduino();

  const addLog = useCallback((message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    setLogs(prev => [...prev, newLog].slice(-50));
  }, []);

  useEffect(() => {
    async function loadModel() {
      setIsModelLoading(true);
      addLog('Neural Engine: Core Synchronization...', 'info');
      try {
        modelRef.current = await cocoSsd.load();
        setIsModelLoading(false);
        addLog('Neural Core ONLINE: Detection Ready', 'success');
      } catch (err) {
        addLog('Neural Core CRITICAL: Initialization Failure', 'error');
      }
    }
    loadModel();
  }, [addLog]);

  const handleFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!modelRef.current || isModelLoading) return;
    const start = performance.now();
    const predictions = await modelRef.current.detect(videoElement);
    const end = performance.now();
    setFps(Math.round(1000 / (end - start)));
    const personDetections = predictions
      .filter(p => p.class === 'person')
      .map(p => ({
        bbox: [(p.bbox[0]/videoElement.videoWidth)*100, (p.bbox[1]/videoElement.videoHeight)*100, (p.bbox[2]/videoElement.videoWidth)*100, (p.bbox[3]/videoElement.videoHeight)*100],
        score: p.score
      }));
    const updatedTrackers = trackerRef.current.update(personDetections, zones);
    setCustomers(updatedTrackers);
  }, [isModelLoading, zones]);

  useEffect(() => {
    customers.forEach(c => {
      // Improved logic: If exiting through entry-exit zone without billing visit
      const hasVisitedBilling = c.history.some(h => h.zone === 'billing');
      const isExiting = c.currentZone === 'entry-exit' && c.history.length > 2 && c.history[c.history.length - 2].zone !== 'entry-exit';
      
      if (isExiting && !hasVisitedBilling && c.status === 'unpaid') {
        addLog(`CRITICAL: UNPAID EXIT VIOLATION [ID: ${c.trackerId}]`, 'alert');
        if (isArduinoConnected) sendAlert();
      }
    });
  }, [customers, addLog, isArduinoConnected, sendAlert]);

  const handleSimulatePayment = async (method: 'QR' | 'POS' | 'Card' | 'UPI') => {
    setIsProcessingPayment(true);
    const payId = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await new Promise(r => setTimeout(r, 2000));
    try {
      const customersInBilling = customers.map(c => ({
        trackerId: c.trackerId,
        currentZone: c.currentZone,
        lastBillingZoneEntryTimestamp: c.lastBillingZoneEntryTimestamp
      }));

      const result = await automatedPaymentMatcher({
        customers: customersInBilling,
        paymentEvent: { paymentId: payId, paymentMethod: method, paymentTimestamp: new Date().toISOString() }
      });

      if (result.success && result.associatedTrackerId) {
        setCustomers(prev => prev.map(c => c.trackerId === result.associatedTrackerId ? { ...c, status: 'paid' } : c));
        addLog(`Payment Associated [${payId}] -> TARGET: ${result.associatedTrackerId}`, 'success');
      } else {
        addLog(`Validation Error [${payId}]: ${result.reason}`, 'warning');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background transition-colors duration-1000 relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          {/* Workspace Area: Left/Center */}
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden min-h-0">
            <div className="flex-[2] relative aura-border rounded-3xl glass overflow-hidden shadow-2xl transition-all duration-700">
              <VideoFeed 
                customers={customers} zones={zones} onZoneChange={setZones}
                isEditingZones={isEditingZones} videoUrl={videoUrl} onFrame={handleFrame}
                isModelLoading={isModelLoading}
              />
            </div>
            
            {/* Telemetry HUD - Now below the video feed */}
            <div className="flex gap-4 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex-1 glass px-6 py-4 rounded-2xl border-white/10 flex items-center justify-between aura-border group hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <Cpu className="w-5 h-5 text-accent animate-pulse" />
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Neural FPS</span>
                    <span className="text-xl font-code text-accent font-bold leading-none">{fps}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-4">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Tracked Units</span>
                    <span className="text-xl font-code text-foreground font-bold leading-none">{customers.length.toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block opacity-60">Security Level</span>
                    <span className="text-xl font-code text-emerald-400 font-bold leading-none">V3.5</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 transition-all duration-700">
              <EventTimeline logs={logs} />
            </div>
          </div>

          {/* Controls Area: Right Column */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 overflow-y-auto pr-2 hide-scrollbar scroll-smooth">
            <SidebarPanels 
              customers={customers} isEditingZones={isEditingZones}
              onToggleEditing={() => setIsEditingZones(!isEditingZones)}
              onSimulatePayment={handleSimulatePayment} isProcessing={isProcessingPayment}
              onVideoUpload={(e) => {
                const file = e.target.files?.[0];
                if (file) setVideoUrl(URL.createObjectURL(file));
              }}
              isArduinoConnected={isArduinoConnected} onConnectArduino={connectArduino}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
