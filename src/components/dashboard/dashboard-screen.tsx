/* eslint-disable @next/next/no-img-element */
"use client";

import { Activity, AlertTriangle, Banknote, Camera, Cpu, Grid3X3, ShieldCheck, Target, Maximize2, X, Info, ArrowRight, CreditCard, QrCode, ScanLine, WalletCards, Radio, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarPanels } from "@/components/dashboard/sidebar-panels";
import { VideoFeed } from "@/components/dashboard/video-feed";
import { EventTimeline } from "@/components/dashboard/event-timeline";
import { TransactionTwinPanel } from "@/components/dashboard/transaction-twin-panel";
import { JudgeDemoPanel } from "@/components/dashboard/judge-demo-panel";
import { cameraStatusClass } from "@/features/dashboard/camera-registry";
import type { DashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { CameraFeedState, DeploymentMode, OperatorLevel } from "@/lib/types";

interface DashboardScreenProps {
  controller: DashboardController;
  deploymentMode?: DeploymentMode;
  operatorLevel?: OperatorLevel;
  onOpenIndiaPage?: () => void;
  onBackToLogin?: () => void;
}

function CameraStatusChip({ camera }: { camera: CameraFeedState }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-code text-[10px] font-bold uppercase tracking-[0.24em] ${cameraStatusClass(
        camera.status,
      )}`}
    >
      {camera.status}
    </span>
  );
}

function CameraTile({
  camera,
  isActive,
  isModelLoading,
  onFrame,
  onTheftEvidence,
  onSelect,
  onCustomerClick,
  showTelemetry = false,
  showClearPeople = false,
  enhancedPrivacyView = false,
}: {
  camera: CameraFeedState;
  isActive: boolean;
  isModelLoading: boolean;
  onFrame: (video: HTMLVideoElement) => Promise<void>;
  onTheftEvidence: (evidence: { customerId: string; timestamp: string; riskScore: number; reasons: string[]; dataUrl: string }) => void;
  onSelect: () => void;
  onCustomerClick: (customerId: string) => void;
  showTelemetry?: boolean;
  showClearPeople?: boolean;
  enhancedPrivacyView?: boolean;
}) {
  const hasAlert = camera.customers.some(
    (customer) => customer.alerted || customer.riskState === "high_risk_suspicious_activity",
  );
  const detectionStatus = isModelLoading ? "LOADING" : camera.sourceKind === "empty" ? "STANDBY" : "ANALYSING";

  return (
    <button
      className={`group aura-border relative min-h-[210px] overflow-hidden rounded-[2rem] border text-left shadow-2xl transition duration-300 ${
        isActive
          ? "border-accent/50 bg-accent/5"
          : "border-white/5 bg-background/45 hover:border-accent/35 hover:bg-accent/5"
      }`}
      type="button"
      onClick={onSelect}
    >
      <VideoFeed
        cameraId={camera.id}
        cameraLabel={camera.label}
        cameraStatus={camera.status}
        customers={camera.customers}
        isActiveCamera={isActive}
        isModelLoading={isModelLoading}
        liveStream={camera.liveStream}
        onFrame={onFrame}
        onTheftEvidence={onTheftEvidence}
        onCustomerClick={onCustomerClick}
        rawDetections={camera.rawDetections}
        detectedProducts={camera.detectedProducts}
        videoUrl={camera.videoUrl}
        zones={camera.zones}
         showClearPeople={showClearPeople}
         enhancedPrivacyView={enhancedPrivacyView}
      />
      <div className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-xl">
        <Camera className="h-3.5 w-3.5 text-accent" />
        <span className="font-code text-[11px] font-bold uppercase tracking-[0.22em] text-white">{camera.label}</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-30">
        <CameraStatusChip camera={camera} />
      </div>
      {showTelemetry && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-xl xl:grid-cols-5">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">FPS</p>
            <p className="font-code text-[11px] font-bold text-white">{camera.fps}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Tracks</p>
            <p className="font-code text-[11px] font-bold text-primary">{camera.customers.length}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Alert</p>
            <p className={`font-code text-[11px] font-bold ${hasAlert ? "text-red-300" : "text-emerald-300"}`}>
              {hasAlert ? "ACTIVE" : "CLEAR"}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Detector</p>
            <p className="font-code text-[11px] font-bold text-cyan-100">{detectionStatus}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Source</p>
            <p className="font-code text-[11px] font-bold uppercase text-accent">{camera.sourceKind}</p>
          </div>
        </div>
      )}
    </button>
  );
}

function getGridSize(cameraCount: number) {
  return Math.ceil(Math.sqrt(Math.max(1, cameraCount)));
}

export function DashboardScreen({ controller, deploymentMode = "single", operatorLevel = "OPERATOR", onOpenIndiaPage, onBackToLogin }: DashboardScreenProps) {
  const canManageEvidence = operatorLevel === "ADMIN" || operatorLevel === "SUPERVISOR";
  const [theftPopup, setTheftPopup] = useState<{ customerId: string; cameraLabel: string; riskScore: number } | null>(null);
  const [fullscreenCameraId, setFullscreenCameraId] = useState<string | null>(null);
  const [transactionTwinCustomerId, setTransactionTwinCustomerId] = useState<string | null>(null);
  const [showJudgeDemo, setShowJudgeDemo] = useState(false);
  const lastAlertRef = useRef<string | null>(null);

  useEffect(() => {
    const alertCustomer = controller.activeCamera.customers.find(
      (customer) => customer.riskState === "high_risk_suspicious_activity" && customer.alertAt,
    );
    if (!alertCustomer?.alertAt) return;

    const alertKey = `${controller.activeCamera.id}:${alertCustomer.id}:${alertCustomer.alertAt}`;
    if (lastAlertRef.current === alertKey) return;
    lastAlertRef.current = alertKey;

    setTheftPopup({
      customerId: alertCustomer.id,
      cameraLabel: controller.activeCamera.label,
      riskScore: alertCustomer.riskScore,
    });

    const timer = window.setTimeout(() => setTheftPopup(null), 5000);
    return () => window.clearTimeout(timer);
  }, [controller.activeCamera]);

  const activeCamera = controller.activeCamera;
  const thumbnailCameras = controller.cameras.filter((camera) => camera.id !== activeCamera.id);
  const isMultiCameraMode = deploymentMode === "multi";
  const gridSize = getGridSize(controller.cameras.length);
  const totalReviewQueue = controller.cameras.reduce(
    (total, camera) =>
      total +
      camera.customers.filter(
        (customer) =>
          customer.riskState === "possible_removal" ||
          customer.riskState === "suspicious_activity" ||
          customer.riskState === "high_risk_suspicious_activity",
      ).length,
    0,
  );

  return (
    <>
      {theftPopup && (
        <div role="alert" aria-live="assertive" aria-atomic="true" className="pointer-events-none fixed right-6 top-6 z-[100] w-[360px] rounded-2xl border border-red-400/50 bg-black/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.9)] animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-300">Security Alert</p>
              <p className="mt-1 font-code text-sm font-bold text-white">High-risk incident requires human review</p>
              <p className="mt-1 text-[10px] text-white/60">{theftPopup.cameraLabel} · {theftPopup.customerId} · {Math.round(theftPopup.riskScore * 100)}% risk</p>
              <p className="mt-2 text-[9px] uppercase tracking-widest text-emerald-300">Face-masked evidence captured · human review required</p>
            </div>
          </div>
        </div>
      )}

    {showJudgeDemo && <JudgeDemoPanel onClose={() => setShowJudgeDemo(false)} />}
    <div className="relative flex h-screen w-full overflow-hidden font-body">
      <Sidebar onOpenIndiaPage={onOpenIndiaPage} onBackToLogin={onBackToLogin} />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header session={controller.session} />
        <main className="flex flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row">
          <div className="flex min-h-0 flex-[3] flex-col gap-6 overflow-y-auto pr-2">
            <section className="order-10 grid shrink-0 gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-accent/20 bg-accent/5 px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-accent/20 bg-black/20 p-2"><Info className="h-4 w-4 text-accent" /></div>
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Privacy-first digital trust</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/75">AI tracks anonymous person IDs and movement signals. It does not identify faces or decide guilt. Payment signals are matched with uncertainty, and high-risk events are routed for human review.</p>
                  </div>
                  <button type="button" onClick={() => setEnhancedPrivacyView((enabled) => !enabled)} disabled={showClearPeople} className={enhancedPrivacyView && !showClearPeople ? "flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-cyan-200" : "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70"} aria-pressed={enhancedPrivacyView} title={showClearPeople ? "Turn off Demo View to enable the privacy mask" : "Show people clearly while masking the estimated head and face region"}><EyeOff className="h-4 w-4" /><span className="text-[8px] font-bold uppercase tracking-widest">{enhancedPrivacyView && !showClearPeople ? "Enhanced privacy · face masked" : "Enhanced privacy view"}</span></button>
                  <button type="button" onClick={() => setShowClearPeople((enabled) => !enabled)} className={showClearPeople ? "flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-amber-200" : "flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-emerald-200"} aria-pressed={showClearPeople}><EyeOff className="h-4 w-4" /><span className="text-[8px] font-bold uppercase tracking-widest">{showClearPeople ? "Demo view · clear people" : "Identity shield ON"}</span></button>
                </div>
              </div>
              <button type="button" onClick={() => setShowJudgeDemo(true)} className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-4 text-left transition hover:border-amber-300/50 hover:bg-amber-400/15">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-200">Presentation mode</p>
                <p className="mt-2 text-sm font-black uppercase tracking-widest text-white">Run Judge Demo</p>
                <p className="mt-1 text-[8px] text-white/40">C07 · UPI · transaction mismatch</p>
              </button>
            </section>

            <section className="order-20 mb-1 grid shrink-0 gap-4 md:grid-cols-4">
              <div className="aura-border rounded-2xl border border-white/5 px-5 py-4 glass">
                <div className="flex items-center gap-3">
                  <Grid3X3 className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Security Wall</p>
                    <p className="font-code text-xl font-bold text-white">{controller.cameras.length} feeds</p>
                  </div>
                </div>
              </div>
              <div className="aura-border rounded-2xl border border-white/5 px-5 py-4 glass">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Active Cameras</p>
                    <p className="font-code text-xl font-bold text-emerald-200">{controller.siteOverview.activeCameraCount}</p>
                  </div>
                </div>
              </div>
              <div className="aura-border rounded-2xl border border-white/5 px-5 py-4 glass">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Total Tracks</p>
                    <p className="font-code text-xl font-bold text-white">{controller.siteOverview.totalTrackedPeople}</p>
                  </div>
                </div>
              </div>
              <div className="aura-border rounded-2xl border border-white/5 px-5 py-4 glass">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Alerts</p>
                    <p className="font-code text-xl font-bold text-red-200">{controller.siteOverview.totalAlerts}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-50 grid shrink-0 gap-3 md:grid-cols-4">
              <div className="md:col-span-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2">
                    <Banknote className="h-5 w-5 text-amber-300" />
                  </div>
                  <div className="min-w-[190px] flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Cash Detection</p>
                    <p className="mt-1 text-[11px] text-white/70">
                      Checkout-only visual detection. It detects cash presence; it does not identify denomination or authenticity.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                    <p className={`font-code text-sm font-bold ${activeCamera.cashDetection.detected ? "text-amber-200" : "text-emerald-300"}`}>
                      {activeCamera.cashDetection.detected ? "CASH DETECTED" : "MONITORING"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Engine</p>
                    <p className="font-code text-sm font-bold uppercase text-cyan-200">{activeCamera.cashDetection.level}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Confidence</p>
                    <p className="font-code text-sm font-bold text-white">{Math.round(activeCamera.cashDetection.confidence * 100)}%</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-60 grid shrink-0 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-4">
              {[
                ["01", "Observe", "Person-only AI detection"],
                ["02", "Understand", "Zones + payment signals"],
                ["03", "Protect", "Mask identities + minimize data"],
                ["04", "Act", "Structured event + human review"],
              ].map(([step, title, detail], index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <span className="font-code text-[10px] font-black text-accent">{step}</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white">{title}</p>
                    <p className="mt-1 text-[8px] leading-4 text-muted-foreground">{detail}</p>
                  </div>
                  {index < 3 && <ArrowRight className="ml-auto hidden h-3 w-3 text-white/20 md:block" />}
                </div>
              ))}
            </section>

            <section className="order-70 grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["UPI", QrCode, "Digital rail", "READY"],
                ["QR", ScanLine, "Scan checkout", "READY"],
                ["POS", CreditCard, "Card terminal", "MONITORING"],
                ["CASH", WalletCards, "Visual presence", activeCamera.cashDetection.detected ? "DETECTED" : "MONITORING"],
              ].map(([label, Icon, detail, status]) => {
                const RailIcon = Icon as typeof QrCode;
                return (
                  <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RailIcon className="h-4 w-4 text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{label as string}</span>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[7px] font-bold tracking-widest ${status === "DETECTED" ? "border-amber-400/30 text-amber-200" : "border-emerald-400/20 text-emerald-300"}`}>{status as string}</span>
                    </div>
                    <p className="mt-3 text-[9px] text-white/40">{detail as string} · INR aware</p>
                  </div>
                );
              })}
            </section>

            <section className="order-80 grid shrink-0 gap-3 lg:grid-cols-[1.35fr_.65fr]">
              <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 to-transparent p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-accent/30 bg-accent/10 p-3"><ScanLine className="h-5 w-5 text-accent" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent">AI Transaction Twin</p>
                      <p className="mt-1 text-sm font-black text-white">CCTV → Basket → Payment → Review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Event bridge active
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {[
                    ["Tracked", String(activeCamera.customers.length), "temporary IDs"],
                    ["Products", String(activeCamera.detectedProducts.filter((p) => p.state !== "lost_tracking").length), "visible tracks"],
                    ["DPI events", String(controller.dpiEvents.length), "event records"],
                    ["Evidence", String(activeCamera.evidenceSnapshots.length), "stored snapshots"],
                  ].map(([value, label, detail]) => (
                    <div key={label} className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="font-code text-lg font-black text-white">{value}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/45">{label}</p>
                      <p className="mt-1 text-[8px] text-white/30">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["SEE", "TWIN", "VERIFY", "ACT"].map((step, index) => (
                    <div key={step} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                      <span className="font-code text-[8px] font-black text-accent">0{index + 1}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/55">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">
                <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-violet-200" /><p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-100">Bharat operator layer</p></div>
                <p className="mt-3 text-[10px] leading-5 text-white/55">Core event structure stays consistent while the operator-facing labels can be presented in English or Hindi.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-widest text-white/35">English</p><p className="mt-1 text-[9px] font-bold text-white/80">Transaction verified</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-widest text-white/35">हिंदी</p><p className="mt-1 text-[9px] font-bold text-white/80">लेनदेन सत्यापित</p></div>
                </div>
              </div>
            </section>

            <section className="order-90 shrink-0 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-emerald-300" /><p className="text-[9px] font-black uppercase tracking-[0.22em] text-white">Live trust activity</p></div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/35">Human review remains in the loop</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {controller.globalLogs.slice(0, 3).map((log, index) => (
                  <div key={String(log.timestamp) + index} className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <p className="text-[8px] uppercase tracking-widest text-accent">{log.type}</p>
                    <p className="mt-1 text-[9px] font-bold text-white/75">{log.message}</p>
                    <p className="mt-1 text-[8px] text-white/30">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
                {controller.globalLogs.length === 0 && <div className="md:col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[9px] text-white/35">Waiting for the first store activity event…</div>}
              </div>
            </section>

            {isMultiCameraMode ? (
              <div className="aura-border min-h-0 flex-[2] overflow-hidden rounded-[2.5rem] border border-accent/20 glass p-4 shadow-2xl">
                <div
                  className="grid h-full min-h-[520px] gap-4 overflow-y-auto pr-1"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridAutoRows: `minmax(${gridSize > 4 ? 190 : 240}px, 1fr)`,
                  }}
                >
                  {controller.cameras.map((camera) => (
                    <CameraTile
                      key={camera.id}
                      camera={camera}
                      isActive={camera.id === activeCamera.id}
                      isModelLoading={controller.isModelLoading}
                      onFrame={(video) => controller.trackFrameForCamera(camera.id, video)}
                      onTheftEvidence={(evidence) => controller.captureTheftEvidence(camera.id, evidence)}
                      onSelect={() => {
                        controller.setActiveCamera(camera.id);
                        setFullscreenCameraId(camera.id);
                      }}
                      onCustomerClick={(customerId) => {
                        controller.setActiveCamera(camera.id);
                        setTransactionTwinCustomerId(customerId);
                      }}
                      showTelemetry
                       showClearPeople={showClearPeople}
                      enhancedPrivacyView={enhancedPrivacyView}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="order-30 flex shrink-0 flex-col gap-4 overflow-visible">
                <div className="aura-border relative h-[520px] min-h-[520px] w-full shrink-0 overflow-hidden rounded-[2.5rem] border border-accent/20 glass shadow-2xl lg:h-[560px] lg:min-h-[560px]">
                  <CameraTile
                    camera={activeCamera}
                    isActive
                    isModelLoading={controller.isModelLoading}
                    onFrame={(video) => controller.trackFrameForCamera(activeCamera.id, video)}
                    onTheftEvidence={(evidence) => controller.captureTheftEvidence(activeCamera.id, evidence)}
                    onSelect={() => controller.setActiveCamera(activeCamera.id)}
                    onCustomerClick={(customerId) => setTransactionTwinCustomerId(customerId)}
                     showClearPeople={showClearPeople}
                     enhancedPrivacyView={enhancedPrivacyView}
                  />
                </div>

                {thumbnailCameras.length > 0 && (
                  <div className="grid max-h-[260px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                    {thumbnailCameras.map((camera) => (
                      <CameraTile
                        key={camera.id}
                        camera={camera}
                        isActive={false}
                        isModelLoading={controller.isModelLoading}
                        onFrame={(video) => controller.trackFrameForCamera(camera.id, video)}
                        onTheftEvidence={(evidence) => controller.captureTheftEvidence(camera.id, evidence)}
                        onSelect={() => controller.setActiveCamera(camera.id)}
                        onCustomerClick={(customerId) => {
                          controller.setActiveCamera(camera.id);
                          setTransactionTwinCustomerId(customerId);
                        }}
                         showClearPeople={showClearPeople}
                         enhancedPrivacyView={enhancedPrivacyView}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="order-40 flex shrink-0 gap-4">
              <div className="aura-border flex flex-1 items-center justify-between rounded-2xl px-8 py-5 glass shadow-xl">
                <div className="flex items-center gap-5">
                  <div className="rounded-xl border border-accent/20 bg-accent/10 p-3">
                    <Cpu className="h-6 w-6 animate-pulse text-accent" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      Active Processor
                    </span>
                    <span className="font-code text-2xl font-bold leading-none text-accent">{activeCamera.fps} FPS</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div className="flex items-center gap-5">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      Active Camera Tracks
                    </span>
                    <span className="font-code text-2xl font-bold leading-none text-foreground">
                      {activeCamera.customers.length}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div className="flex items-center gap-5">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      Site Review Queue
                    </span>
                    <span className="font-code text-2xl font-bold leading-none text-emerald-400">{totalReviewQueue}</span>
                  </div>
                </div>
              </div>
            </div>

            {isMultiCameraMode ? (
              <div className="order-100 min-h-0 flex-1">
                <EventTimeline logs={controller.globalLogs} title="Global Event Feed" />
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
                <EventTimeline logs={controller.globalLogs} title="Global Event Feed" />
                <EventTimeline logs={activeCamera.logs} title={`${activeCamera.label} Timeline`} />
              </div>
            )}
          </div>

          <div className="hide-scrollbar flex w-full flex-col gap-6 overflow-y-auto pr-2 lg:w-[420px]">
            <div className="aura-border rounded-2xl border border-accent/20 bg-background/60 p-5 glass shadow-xl">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        Digital Trust Layer
      </p>

      <p className="mt-1 font-code text-lg font-bold text-white">
        DPI Event Bridge
      </p>
    </div>

    <ShieldCheck className="h-6 w-6 text-emerald-400" />
  </div>

  {/* LIVE EVENT COUNT + PRIVACY */}
  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        Live Events
      </p>

      <p className="mt-1 font-code text-xl font-bold text-white">
        {controller.dpiEvents.length}
      </p>
    </div>

    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        Privacy
      </p>

      <p className="mt-1 font-code text-sm font-bold text-emerald-300">
        Protected
      </p>
    </div>
  </div>

  {/* SHOW LIVE DPI EVENTS */}
  {controller.dpiEvents.length > 0 ? (
    <div className="mt-3 space-y-2">
      {controller.dpiEvents.slice(0, 2).map((event) => (
        <div
          key={event.eventId}
          className="rounded-xl border border-white/10 bg-black/20 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-code text-[10px] font-bold text-cyan-200">
              {event.eventType}
            </p>

            <span
              className={`rounded-full px-2 py-1 font-code text-[9px] font-bold ${
                event.riskLevel === "HIGH"
                  ? "bg-red-500/15 text-red-300"
                  : event.riskLevel === "MEDIUM"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {event.riskLevel}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
            <div>
              <p className="uppercase tracking-widest text-muted-foreground">
                Subject
              </p>

              <p className="mt-1 font-code text-white">
                {event.subjectToken}
              </p>
            </div>

            <div>
              <p className="uppercase tracking-widest text-muted-foreground">
                Transaction
              </p>

              <p className="mt-1 font-code text-white">
                {event.transactionStatus}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        Interoperability
      </p>

      <p className="mt-1 text-xs text-white/80">
        Waiting for a store activity event
      </p>
    </div>
  )}
</div>
            <div className="aura-border rounded-2xl border border-red-400/20 bg-background/60 p-5 glass shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Security Evidence</p>
                  <p className="mt-1 font-code text-lg font-bold text-white">Theft Snapshots</p>
                </div>
                <Camera className="h-6 w-6 text-red-300" />
              </div>
              {activeCamera.evidenceSnapshots.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {activeCamera.evidenceSnapshots.slice(0, 2).map((evidence) => (
                      <div key={evidence.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        <img src={evidence.dataUrl} alt={`Security evidence for ${evidence.customerId}`} className="aspect-video w-full object-cover" />
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-code text-[10px] font-bold text-red-200">{evidence.customerId}</span>
                            <span className="font-code text-[9px] text-white/60">{Math.round(evidence.riskScore * 100)}% risk</span>
                          </div>
                          <p className="mt-1 text-[9px] text-white/60">{new Date(evidence.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">Local-only storage · {operatorLevel}</p>
                    <p className="mt-1 text-[9px] text-white/50">Evidence stays on this browser device.</p>
                  </div>
                  {canManageEvidence && (
                    <button
                      type="button"
                      onClick={() => void controller.clearTheftEvidence(activeCamera.id)}
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-400/10"
                    >
                      Clear
                    </button>
                  )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">No review evidence captured yet.</p>
                  <p className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3 text-[9px] text-emerald-200/70">Privacy: evidence is face-masked and stored only in this browser&apos;s local IndexedDB.</p>
                </div>
              )}
            </div>
            <SidebarPanels
              activeCamera={activeCamera}
              activeCameraId={controller.activeCameraId}
              arduinoStatus={controller.arduinoStatus}
              buzzerTestMessage={controller.buzzerTestMessage}
              buzzerTestStatus={controller.buzzerTestStatus}
              cameras={controller.cameras}
              customers={controller.customers}
              items={controller.items}
              isBlockedByPolicy={controller.isBlockedByPolicy}
              isLiveCaptureActive={controller.isLiveCaptureActive}
              isProcessing={controller.isProcessingPayment}
              isTestingBuzzer={controller.isTestingBuzzer}
              isVideoLoaded={controller.isVideoLoaded}
              onAddCamera={controller.addCamera}
              onConnectArduino={controller.connectArduino}
              onLocalCameraStart={() => controller.startLocalCameraForCamera(activeCamera.id)}
              onRemoveCamera={controller.removeCamera}
              onRenameCamera={controller.renameCamera}
              onSelectCamera={controller.setActiveCamera}
              onSetStreamUrl={controller.setCameraStreamUrl}
              onStartScreenCapture={controller.startScreenCapture}
              onStopCameraSource={controller.stopCameraSource}
              onStopScreenCapture={controller.stopScreenCapture}
              onSimulatePayment={controller.simulatePayment}
              onTestAlert={controller.sendTestAlert}
              onVideoUpload={controller.uploadVideo}
            />
          </div>
        </main>
      </div>
      {fullscreenCameraId && (() => {
        const fullscreenCamera = controller.cameras.find((camera) => camera.id === fullscreenCameraId);
        if (!fullscreenCamera) return null;
        return (
          <div className="fixed inset-0 z-[200] bg-black/95 p-4 backdrop-blur-2xl md:p-6">
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-4 py-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-accent">Full-screen camera view</p>
                  <p className="mt-1 font-code text-sm font-bold text-white">{fullscreenCamera.label} · {fullscreenCamera.id}</p>
                </div>
                <button type="button" onClick={() => setFullscreenCameraId(null)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-white hover:bg-white/10" aria-label="Close full-screen camera">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-accent/30 bg-black shadow-2xl">
                <VideoFeed
                  cameraId={fullscreenCamera.id}
                  cameraLabel={fullscreenCamera.label}
                  cameraStatus={fullscreenCamera.status}
                  customers={fullscreenCamera.customers}
                  isActiveCamera
                  isModelLoading={controller.isModelLoading}
                  liveStream={fullscreenCamera.liveStream}
                  onFrame={(video) => controller.trackFrameForCamera(fullscreenCamera.id, video)}
                  onTheftEvidence={(evidence) => controller.captureTheftEvidence(fullscreenCamera.id, evidence)}
                  onCustomerClick={(customerId) => setTransactionTwinCustomerId(customerId)}
                  rawDetections={fullscreenCamera.rawDetections}
                  detectedProducts={fullscreenCamera.detectedProducts}
                  videoUrl={fullscreenCamera.videoUrl}
                  zones={fullscreenCamera.zones}
                  showClearPeople={showClearPeople}
                  enhancedPrivacyView={enhancedPrivacyView}
                />
                <div className="pointer-events-none absolute left-4 top-4 z-40 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-black/70 px-3 py-2 backdrop-blur-xl">
                  <Maximize2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-200">{showClearPeople ? "Demo view · people visible" : enhancedPrivacyView ? "Enhanced privacy · face masked" : "Identity shield · faces masked"}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {transactionTwinCustomerId && (
        <TransactionTwinPanel
          camera={controller.activeCamera}
          customerId={transactionTwinCustomerId}
          onClose={() => setTransactionTwinCustomerId(null)}
        />
      )}
    </div>
    </>
  );
}
