"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MoveDiagonal2, RotateCcw, Save, Settings2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ZoneDefinition } from "@/lib/types";
import { INITIAL_ZONES } from "@/features/dashboard/dashboard-config";

interface ZoneConfigurationScreenProps {
  zones: ZoneDefinition[];
  onContinueWithRecommendedLayout: () => void;
  onSaveLayout: (zones: ZoneDefinition[]) => void;
}

type ZoneEditorMode = "prompt" | "edit";
type DragAction = "move" | "resize";
type EditableZoneId = "checkout" | "shelf" | "exit" | "outside";

interface Point {
  x: number;
  y: number;
}

interface DragState {
  zoneId: EditableZoneId;
  action: DragAction;
  startPoint: Point;
  originalZone: ZoneDefinition;
}

const EDITABLE_ZONE_IDS: EditableZoneId[] = ["checkout", "shelf", "exit", "outside"];
const MIN_ZONE_WIDTH = 4;
const MIN_ZONE_HEIGHT = 8;

const EDITOR_LABELS: Record<EditableZoneId, string> = {
  checkout: "Checkout Zone",
  shelf: "Shopping/AI Zone",
  exit: "Exit Buffer",
  outside: "Outside Boundary",
};

function cloneZones(zones: ZoneDefinition[]) {
  return zones.map((zone) => ({ ...zone }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isEditableZoneId(zoneId: string): zoneId is EditableZoneId {
  return EDITABLE_ZONE_IDS.includes(zoneId as EditableZoneId);
}

function resetRecommendedZones() {
  return cloneZones(INITIAL_ZONES);
}

export const ZoneConfigurationScreen: React.FC<ZoneConfigurationScreenProps> = ({
  zones,
  onContinueWithRecommendedLayout,
  onSaveLayout,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<ZoneEditorMode>("prompt");
  const [draftZones, setDraftZones] = useState<ZoneDefinition[]>(() => cloneZones(zones));
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    setDraftZones(cloneZones(zones));
  }, [zones]);

  const getPointerPoint = useCallback((event: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }, []);

  const handlePointerDown = (
    event: React.PointerEvent<SVGElement>,
    zone: ZoneDefinition,
    action: DragAction,
  ) => {
    if (!isEditableZoneId(zone.id)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const syntheticEvent = event as unknown as React.PointerEvent<SVGSVGElement>;
    setDragState({
      zoneId: zone.id,
      action,
      startPoint: getPointerPoint(syntheticEvent),
      originalZone: { ...zone },
    });
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    const point = getPointerPoint(event);
    const dx = point.x - dragState.startPoint.x;
    const dy = point.y - dragState.startPoint.y;

    setDraftZones((previousZones) =>
      previousZones.map((zone) => {
        if (zone.id !== dragState.zoneId) {
          return zone;
        }

        if (dragState.action === "move") {
          return {
            ...zone,
            x: clamp(dragState.originalZone.x + dx, 0, 100 - dragState.originalZone.width),
            y: clamp(dragState.originalZone.y + dy, 0, 100 - dragState.originalZone.height),
          };
        }

        return {
          ...zone,
          width: clamp(dragState.originalZone.width + dx, MIN_ZONE_WIDTH, 100 - zone.x),
          height: clamp(dragState.originalZone.height + dy, MIN_ZONE_HEIGHT, 100 - zone.y),
        };
      }),
    );
  };

  const editableZones = draftZones.filter((zone) => isEditableZoneId(zone.id));

  if (mode === "prompt") {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-6 backdrop-blur-xl">
        <div className="relative w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-white/10 glass p-8 shadow-2xl aura-border">
          <div className="absolute inset-0 shimmer opacity-5 pointer-events-none" />

          <div className="mb-7 flex items-center gap-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
              <Settings2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-black uppercase tracking-[0.22em] text-foreground">
                Zone Configuration
              </h2>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                This store already has recommended zone boundaries configured. Would you like to adjust them before starting analysis?
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={onContinueWithRecommendedLayout}
              className="h-12 rounded-xl border border-accent/40 bg-accent/10 text-[10px] font-bold uppercase tracking-[0.18em] text-accent hover:bg-accent/20"
            >
              Continue With Recommended Layout
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("edit")}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-white/10"
            >
              Adjust Zones
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-xl">
      <div className="relative grid w-full max-w-[980px] gap-5 overflow-hidden rounded-[2rem] border border-white/10 glass p-6 shadow-2xl aura-border lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <h2 className="font-headline text-lg font-black uppercase tracking-[0.22em] text-foreground">
              Zone Configuration
            </h2>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Move or resize the primary store zones before analysis starts.
            </p>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragState(null)}
            onPointerLeave={() => setDragState(null)}
            className="aspect-video w-full rounded-2xl border border-white/10 bg-black/50"
          >
            <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.03)" />
            {editableZones.map((zone) => (
              <g key={zone.id}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  rx="1"
                  fill={zone.color}
                  fillOpacity="0.18"
                  stroke={zone.color}
                  strokeWidth="0.9"
                  className="cursor-move"
                  onPointerDown={(event) => handlePointerDown(event, zone, "move")}
                />
                <text
                  x={zone.x + 1}
                  y={zone.y + 4}
                  fill={zone.color}
                  style={{ fontSize: "2px", fontWeight: "bold" }}
                >
                  {EDITOR_LABELS[zone.id as EditableZoneId]}
                </text>
                <circle
                  cx={zone.x + zone.width}
                  cy={zone.y + zone.height}
                  r="1.7"
                  fill="white"
                  stroke={zone.color}
                  strokeWidth="0.7"
                  className="cursor-se-resize"
                  onPointerDown={(event) => handlePointerDown(event, zone, "resize")}
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-3">
            {editableZones.map((zone) => (
              <div key={zone.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
                    {EDITOR_LABELS[zone.id as EditableZoneId]}
                  </span>
                  <Badge
                    variant="outline"
                    className="h-5 border-white/10 text-[8px]"
                    style={{ color: zone.color }}
                  >
                    {zone.type}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wide text-muted-foreground">
                  <span>X {zone.x.toFixed(1)}</span>
                  <span>Y {zone.y.toFixed(1)}</span>
                  <span>W {zone.width.toFixed(1)}</span>
                  <span>H {zone.height.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Button
              onClick={() => onSaveLayout(draftZones)}
              className="h-11 rounded-xl border border-accent/40 bg-accent/10 text-[10px] font-bold uppercase tracking-[0.18em] text-accent hover:bg-accent/20"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Layout
            </Button>
            <Button
              variant="outline"
              onClick={() => setDraftZones(resetRecommendedZones())}
              className="h-11 rounded-xl border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-white/10"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Recommended Layout
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDraftZones(cloneZones(zones));
                setMode("prompt");
              }}
              className="h-11 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-6 hidden rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground lg:flex lg:items-center lg:gap-2">
          <MoveDiagonal2 className="h-3 w-3" />
          Drag zones
        </div>
      </div>
    </div>
  );
};
