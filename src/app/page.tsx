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
  { id: 'z1', type: 'entry', label: 'Entry Gate', x: 5, y: 10, width: 20, height: 80, color: '#1988F5' },
  { id: 'z2', type: 'billing', label: 'Billing Counter', x: 40, y: 40, width: 20, height: 25, color: '#0FFCEB' },
  { id: 'z3', type: 'exit', label: 'Security Exit', x: 75, y: 10, width: 20, height: 80, color: '#ef4444' },
  { id: 'z4', type: 'shopping', label: 'Floor Area', x: 25, y: 10, width: 50, height: 80, color: '#f59e0b' },
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
      addLog('Neural Vision Engine: INITIALIZING...', 'info');
      try {
        modelRef.current = await cocoSsd.load();
        setIsModelLoading(false);
        addLog('Neural Core ONLINE: Models Loaded', 'success');
      } catch (err) {
        addLog('Failed to load Vision Engine', 'error');
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
        addLog(`CRITICAL: UNPAID EXIT DETECTED [ID: ${c.trackerId}]`, 'alert');
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
        addLog(`Payment Verified: ${result.reason}`, 'success');
      } else {
        addLog(`Payment Mismatch: ${result.reason}`, 'warning');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background transition-colors duration-700">
      <AnimatedBackground />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Workspace Area: Center + Bottom */}
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 relative aura-border rounded-xl glass overflow-hidden">
              <VideoFeed 
                customers={customers} zones={zones} onZoneChange={setZones}
                isEditingZones={isEditingZones} videoUrl={videoUrl} onFrame={handleFrame}
                isModelLoading={isModelLoading} fps={fps}
              />
            </div>
            <div className="h-64 aura-border rounded-xl">
              <EventTimeline logs={logs} />
            </div>
          </div>
          {/* Controls Area: Right Column */}
          <div className="w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 hide-scrollbar">
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