
"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/dashboard/header';
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

  // Load AI Model
  useEffect(() => {
    async function loadModel() {
      setIsModelLoading(true);
      addLog('Loading Neural Vision Engine...', 'info');
      try {
        modelRef.current = await cocoSsd.load();
        setIsModelLoading(false);
        addLog('AI Model Loaded Successfully', 'success');
      } catch (err) {
        addLog('Failed to load Vision Engine', 'error');
      }
    }
    loadModel();
  }, [addLog]);

  // Main Detection Loop
  const handleFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!modelRef.current || isModelLoading) return;

    const start = performance.now();
    const predictions = await modelRef.current.detect(videoElement);
    const end = performance.now();
    setFps(Math.round(1000 / (end - start)));

    // Filter for persons
    const personDetections = predictions
      .filter(p => p.class === 'person')
      .map(p => ({
        bbox: [
          (p.bbox[0] / videoElement.videoWidth) * 100,
          (p.bbox[1] / videoElement.videoHeight) * 100,
          (p.bbox[2] / videoElement.videoWidth) * 100,
          (p.bbox[3] / videoElement.videoHeight) * 100,
        ],
        score: p.score
      }));

    const updatedTrackers = trackerRef.current.update(personDetections, zones);
    setCustomers(updatedTrackers);
  }, [isModelLoading, zones]);

  // Automated Payment Matching Trigger
  useEffect(() => {
    const billingCustomers = customers.filter(c => c.currentZone === 'billing' && c.status === 'unpaid');
    
    billingCustomers.forEach(async (c) => {
      // Small delay to simulate processing or wait for a webhook/simulated POS event
      if (Math.random() > 0.98) { // Simulate random POS activity for prototype
        handleSimulatePayment('POS', c.trackerId);
      }
    });
  }, [customers]);

  // Alert System for Unpaid Exit
  useEffect(() => {
    customers.forEach(c => {
      if (c.currentZone === 'exit' && c.status === 'unpaid') {
        addLog(`ALERT: UNPAID EXIT [ID: ${c.trackerId}]`, 'alert');
        if (isArduinoConnected) {
          sendAlert();
          addLog(`Serial ALERT signal sent to Arduino Nano`, 'warning');
        }
        // Flag customer
        setCustomers(prev => prev.map(p => p.trackerId === c.trackerId ? { ...p, status: 'flagged' } : p));
      }
    });
  }, [customers, addLog, isArduinoConnected, sendAlert]);

  const handleSimulatePayment = async (method: 'QR' | 'POS' | 'Card' | 'UPI', forceId?: string) => {
    setIsProcessingPayment(true);
    const timestamp = new Date().toISOString();
    
    try {
      const result = await automatedPaymentMatcher({
        customers: customers.map(c => ({
          trackerId: c.trackerId,
          currentZone: c.currentZone,
          lastBillingZoneEntryTimestamp: c.lastBillingZoneEntryTimestamp,
        })),
        paymentEvent: {
          paymentId: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          paymentMethod: method,
          paymentTimestamp: timestamp,
        }
      });

      const matchedId = forceId || result.associatedTrackerId;

      if (matchedId) {
        setCustomers(prev => prev.map(c => 
          c.trackerId === matchedId 
            ? { ...c, status: 'paid' } 
            : c
        ));
        addLog(`Payment Associated with ${matchedId}: ${result.reason || 'Auto-matched'}`, 'success');
      } else {
        addLog(`Payment Injection Failed: No matching customer in Billing Zone`, 'warning');
      }
    } catch (err) {
      addLog('Neural Matcher Error: Failed to process association', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      addLog(`Switching Source: ${file.name}`, 'success');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AnimatedBackground />
      <Header />
      
      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Column: Visual Monitoring */}
        <div className="flex-[2] flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 relative min-h-0">
            <VideoFeed 
              customers={customers} 
              zones={zones} 
              onZoneChange={setZones}
              isEditingZones={isEditingZones}
              videoUrl={videoUrl}
              onFrame={handleFrame}
              isModelLoading={isModelLoading}
              fps={fps}
            />
          </div>
          <div className="h-1/3 min-h-[200px]">
            <EventTimeline logs={logs} />
          </div>
        </div>

        {/* Right Column: Intelligence & Controls */}
        <div className="w-96 flex flex-col gap-6 overflow-hidden">
          <SidebarPanels 
            customers={customers}
            isEditingZones={isEditingZones}
            onToggleEditing={() => setIsEditingZones(!isEditingZones)}
            onSimulatePayment={(method) => handleSimulatePayment(method)}
            isProcessing={isProcessingPayment}
            onVideoUpload={handleVideoUpload}
            isArduinoConnected={isArduinoConnected}
            onConnectArduino={connectArduino}
          />
        </div>
      </main>

      <div className="fixed bottom-2 right-6 pointer-events-none opacity-30 select-none">
        <span className="text-[10px] font-code tracking-[0.5em] text-white uppercase">
          Neural State: {isModelLoading ? 'Initializing' : 'Live Monitoring'} // Hardware: {isArduinoConnected ? 'Synced' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
