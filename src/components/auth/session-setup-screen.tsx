"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OperatorSession } from "@/lib/types";
import { CreditCard, QrCode, Smartphone, Wifi } from "lucide-react";

interface SessionSetupScreenProps {
  session: OperatorSession;
  onComplete: () => void;
  onSkip: () => void;
}

interface SetupFields {
  qr: string;
  pos: string;
  card: string;
  upi: string;
}

function defaultFieldsFor(session: OperatorSession): SetupFields {
  const modeTag = session.mode === "LOCAL" ? "LOCAL" : "ACTIVE";
  return {
    qr: `${modeTag}-QR-01`,
    pos: `${modeTag}-POS-01`,
    card: `${modeTag}-CARD-01`,
    upi: `${modeTag.toLowerCase()}.demo@upi`,
  };
}

export const SessionSetupScreen: React.FC<SessionSetupScreenProps> = ({
  session,
  onComplete,
  onSkip,
}) => {
  const [fields, setFields] = useState<SetupFields>(() => defaultFieldsFor(session));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-6 py-8 backdrop-blur-xl">
      <div className="relative w-full max-w-[760px] overflow-hidden rounded-[2.5rem] border border-white/10 glass p-8 md:p-10 shadow-2xl aura-border">
        <div className="absolute inset-0 shimmer opacity-5 pointer-events-none" />

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-black uppercase tracking-[0.24em] text-foreground">
              Verification Setup
            </h2>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Confirm local demo inputs before dashboard session start
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent">
              {session.mode}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-muted-foreground">
              {session.store}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Label className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <QrCode className="h-4 w-4 text-accent" />
              QR Terminal
            </Label>
            <Input
              value={fields.qr}
              onChange={(event) => setFields((previous) => ({ ...previous, qr: event.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-black/30 text-xs font-code"
              placeholder="LOCAL-QR-01"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Label className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              POS Terminal
            </Label>
            <Input
              value={fields.pos}
              onChange={(event) => setFields((previous) => ({ ...previous, pos: event.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-black/30 text-xs font-code"
              placeholder="LOCAL-POS-01"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Label className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              Card Gateway
            </Label>
            <Input
              value={fields.card}
              onChange={(event) => setFields((previous) => ({ ...previous, card: event.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-black/30 text-xs font-code"
              placeholder="LOCAL-CARD-01"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Label className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Wifi className="h-4 w-4 text-violet-400" />
              UPI Endpoint
            </Label>
            <Input
              value={fields.upi}
              onChange={(event) => setFields((previous) => ({ ...previous, upi: event.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-black/30 text-xs font-code"
              placeholder="local.demo@upi"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <Button
            onClick={onComplete}
            className="h-12 flex-1 rounded-xl border border-accent/40 bg-accent/10 text-[10px] font-bold uppercase tracking-[0.25em] text-accent hover:bg-accent/20"
          >
            Launch Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={onSkip}
            className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Skip Setup
          </Button>
        </div>
      </div>
    </div>
  );
};
