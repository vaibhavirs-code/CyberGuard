"use client";

import React, { useMemo, useState } from "react";
import { Camera, Grid3X3, MonitorDot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DeploymentConfig, DeploymentMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DeploymentSelectionScreenProps {
  onBack: () => void;
  onLaunch: (config: DeploymentConfig) => void;
}

const PRESET_COUNTS = [1, 2, 4, 6, 8, 12, 16, 20];

function getGridLabel(cameraCount: number) {
  const gridSize = Math.ceil(Math.sqrt(Math.max(1, cameraCount)));
  return `${gridSize} x ${gridSize}`;
}

export const DeploymentSelectionScreen: React.FC<DeploymentSelectionScreenProps> = ({ onBack, onLaunch }) => {
  const [mode, setMode] = useState<DeploymentMode>("single");
  const [cameraCount, setCameraCount] = useState(4);

  const normalizedCameraCount = useMemo(() => Math.max(1, Math.floor(cameraCount || 1)), [cameraCount]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-background px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.06),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute left-0 top-0 h-1 w-full animate-scanline bg-accent/30 shadow-[0_0_20px_hsl(var(--accent))]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl animate-in fade-in zoom-in-95 duration-700">
        <div className="glass aura-border overflow-hidden rounded-[2rem] border border-primary/20 bg-black/50 p-8 md:p-10">
          <div className="mb-9 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15 glow-pulse">
                <ShieldCheck className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-black uppercase tracking-[0.24em] text-foreground md:text-4xl">
                  CyberGuard <span className="text-primary glow-text">Vision</span>
                </h1>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.44em] text-muted-foreground">
                  Select Monitoring Mode
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 font-code text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              {mode === "multi" ? `${normalizedCameraCount} feeds / ${getGridLabel(normalizedCameraCount)}` : "single feed"}
            </div>
          </div>

          <RadioGroup value={mode} onValueChange={(value) => setMode(value as DeploymentMode)} className="grid gap-4">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition-all",
                mode === "single" ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/5 hover:border-accent/30",
              )}
            >
              <RadioGroupItem value="single" />
              <Camera className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">Single Camera Monitoring</p>
                <p className="mt-1 text-xs text-muted-foreground">Launches the existing dashboard behavior unchanged.</p>
              </div>
            </label>

            <label
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition-all",
                mode === "multi" ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5 hover:border-primary/30",
              )}
            >
              <RadioGroupItem value="multi" />
              <Grid3X3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">Multi Camera Monitoring</p>
                <p className="mt-1 text-xs text-muted-foreground">Generates an independent CCTV control-room grid.</p>
              </div>
            </label>
          </RadioGroup>

          {mode === "multi" && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MonitorDot className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                    Number of Cameras
                  </span>
                </div>
                <span className="font-code text-xs font-bold text-accent">{getGridLabel(normalizedCameraCount)} grid</span>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <input
                  min={1}
                  step={1}
                  type="number"
                  value={cameraCount}
                  onChange={(event) => setCameraCount(Number(event.target.value))}
                  className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 font-code text-lg font-bold text-white outline-none transition focus:border-primary/60"
                />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setCameraCount(count)}
                      className={cn(
                        "h-14 min-w-14 rounded-xl border px-4 font-code text-xs font-bold transition",
                        normalizedCameraCount === count
                          ? "border-primary/50 bg-primary/20 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3"><Button variant="ghost" onClick={onBack}>Back</Button><Button
            onClick={() => {
              onLaunch({
                mode,
                cameraCount: mode === "multi" ? normalizedCameraCount : 1,
              });
            }}
            className="h-16 flex-1 w-full rounded-2xl border border-accent/40 bg-accent/10 text-xs font-bold uppercase tracking-[0.36em] text-accent transition-all hover:scale-[1.01] hover:bg-accent/20 aura-border"
          >
            Launch System
          </Button>
        </div>
      </div>
    </div>
  );
};
