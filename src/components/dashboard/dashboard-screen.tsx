"use client";

import { Activity, AlertTriangle, Camera, Cpu, Grid3X3, ShieldCheck, Target } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarPanels } from "@/components/dashboard/sidebar-panels";
import { VideoFeed } from "@/components/dashboard/video-feed";
import { EventTimeline } from "@/components/dashboard/event-timeline";
import { cameraStatusClass } from "@/features/dashboard/camera-registry";
import type { DashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { CameraFeedState, DeploymentMode } from "@/lib/types";

interface DashboardScreenProps {
  controller: DashboardController;
  deploymentMode?: DeploymentMode;
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
  onSelect,
  showTelemetry = false,
}: {
  camera: CameraFeedState;
  isActive: boolean;
  isModelLoading: boolean;
  onFrame: (video: HTMLVideoElement) => Promise<void>;
  onSelect: () => void;
  showTelemetry?: boolean;
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
        rawDetections={camera.rawDetections}
        videoUrl={camera.videoUrl}
        zones={camera.zones}
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

export function DashboardScreen({ controller, deploymentMode = "single" }: DashboardScreenProps) {
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
    <div className="relative flex h-screen w-full overflow-hidden font-body">
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header session={controller.session} />
        <main className="flex flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row">
          <div className="flex min-h-0 flex-[3] flex-col gap-6 overflow-hidden">
            <section className="grid gap-4 md:grid-cols-4">
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
                      onSelect={() => controller.setActiveCamera(camera.id)}
                      showTelemetry
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-[2] flex-col gap-4 overflow-hidden">
                <div className="aura-border relative min-h-[360px] flex-[2] overflow-hidden rounded-[2.5rem] border border-accent/20 glass shadow-2xl">
                  <CameraTile
                    camera={activeCamera}
                    isActive
                    isModelLoading={controller.isModelLoading}
                    onFrame={(video) => controller.trackFrameForCamera(activeCamera.id, video)}
                    onSelect={() => controller.setActiveCamera(activeCamera.id)}
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
                        onSelect={() => controller.setActiveCamera(camera.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
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
              <div className="min-h-0 flex-1">
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
    </div>
  );
}
