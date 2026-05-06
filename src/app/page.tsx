"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/dashboard/header';
import { VideoFeed } from '@/components/dashboard/video-feed';
import { SidebarPanels } from '@/components/dashboard/sidebar-panels';
import { EventTimeline } from '@/components/dashboard/event-timeline';
import { AnimatedBackground } from '@/components/dashboard/animated-background';
import { Zone, TrackedCustomer, SystemLog } from '@/lib/types';
import { createInitialCustomers, updateCustomerPositions } from '@/lib/simulator';
import { automatedPaymentMatcher } from '@/ai/flows/automated-payment-matcher';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const addLog = useCallback((message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    setLogs(prev => [...prev, newLog].slice(-50));
  }, []);

  // Initialize Simulator
  useEffect(() => {
    setCustomers(createInitialCustomers());
    addLog('AI Surveillance Engine Initialized', 'success');
    addLog('Arduino Nano connection: SERIAL_PORT_SIMULATED', 'info');
  }, [addLog]);

  // Movement Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomers(prev => updateCustomerPositions(prev, zones));
    }, 100);
    return () => clearInterval(interval);
  }, [zones]);

  // Alert System for Unpaid Exit
  useEffect(() => {
    customers.forEach(c => {
      if (c.currentZone === 'exit' && c.status === 'unpaid') {
        // Trigger simulation of Arduino Alert
        addLog(`ALERT: UNPAID EXIT ATTEMPT [ID: ${c.trackerId}]`, 'alert');
        addLog(`Serial Command Sent: ALERT\\n to Arduino Nano`, 'warning');
        
        // Visual indicator in logs
        setCustomers(prev => prev.map(p => p.trackerId === c.trackerId ? { ...p, status: 'flagged' } : p));
      }
    });
  }, [customers, addLog]);

  const handleSimulatePayment = async (method: 'QR' | 'POS' | 'Card' | 'UPI') => {
    setIsProcessingPayment(true);
    const timestamp = new Date().toISOString();
    addLog(`Incoming ${method} payment detected. Matching...`, 'info');

    try {
      // Use the GenAI flow to match payment with customer in billing zone
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

      if (result.success && result.associatedTrackerId) {
        setCustomers(prev => prev.map(c => 
          c.trackerId === result.associatedTrackerId 
            ? { ...c, status: 'paid' } 
            : c
        ));
        addLog(`Payment Associated: ${result.reason}`, 'success');
      } else {
        addLog(`Match Failed: ${result.reason}`, 'warning');
      }
    } catch (err) {
      addLog('Neural Matcher Error: Failed to process association', 'error');
    } finally {
      setIsProcessingPayment(false);
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
            onSimulatePayment={handleSimulatePayment}
            isProcessing={isProcessingPayment}
          />
        </div>
      </main>

      {/* Footer Branding Overlay */}
      <div className="fixed bottom-2 right-6 pointer-events-none opacity-30 select-none">
        <span className="text-[10px] font-code tracking-[0.5em] text-white">
          SECURITY LEVEL: CLASSIFIED // CYBERGUARD_OS_V2.0
        </span>
      </div>
    </div>
  );
}
