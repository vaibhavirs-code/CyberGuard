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

const INITIAL_ZONES: Zone[] = [
  { id: 'z1', type: 'entry', label: 'Entry Perimeter', x: 5, y: 10, width: 20, height: 80, color: '#1988F5' },
  { id: 'z2', type: 'billing', label: 'Billing Interface', x: 40, y: 40, width: 20, height: 25, color: '#0FFCEB' },
  { id: 'z3', type: 'exit', label: 'Security Gate', x: 75, y: 10, width: 20, height: 80, color: '#ef4444' },
  { id: 'z4', type: 'shopping', label: 'Floor Matrix', x: 25, y: 10, width: 50, height: 80, color: '#f59e0b' },
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
      if (c.currentZone === 'exit' && c.status === 'unpaid') {
        addLog(`CRITICAL: UNPAID EXIT VIOLATION [TARGET: ${c.trackerId}]`, 'alert');
        if (isArduinoConnected) sendAlert();
      }
    });
  }, [customers, addLog, isArduinoConnected, sendAlert]);

  const handleSimulatePayment = async (method: 'QR' | 'POS' | 'Card' | 'UPI') => {
    setIsProcessingPayment(true);
    const payId = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await new Promise(r => setTimeout(r, 2000));
    try {
      const result = await automatedPaymentMatcher({
        customers: customers.map(c => ({ trackerId: c.trackerId, currentZone: c.currentZone, lastBillingZoneEntryTimestamp: c.lastBillingZoneEntryTimestamp })),
        paymentEvent: { paymentId: payId, paymentMethod: method, paymentTimestamp: new Date().toISOString() }
      });
      if (result.success && result.associatedTrackerId) {
        setCustomers(prev => prev.map(c => c.trackerId === result.associatedTrackerId ? { ...c, status: 'paid' } : c));
        addLog(`Payment Verified [${payId}]: ${result.reason}`, 'success');
      } else {
        addLog(`Validation Error [${payId}]: ${result.reason}`, 'warning');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background transition-colors duration-1000 relative">
      <AnimatedBackground />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
          {/* Workspace Area: Left/Center */}
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden min-h-0">
            <div className="flex-1 relative aura-border rounded-3xl glass overflow-hidden shadow-2xl transition-all duration-700">
              <div className="absolute inset-0 shimmer opacity-5 pointer-events-none" />
              <VideoFeed 
                customers={customers} zones={zones} onZoneChange={setZones}
                isEditingZones={isEditingZones} videoUrl={videoUrl} onFrame={handleFrame}
                isModelLoading={isModelLoading} fps={fps}
              />
            </div>
            <div className="h-64 lg:h-72 transition-all duration-700">
              <EventTimeline logs={logs} />
            </div>
          </div>
          {/* Controls Area: Right Column */}
          <div className="w-full lg:w-[420px] flex flex-col gap-6 overflow-y-auto pr-2 lg:pr-4 hide-scrollbar scroll-smooth">
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