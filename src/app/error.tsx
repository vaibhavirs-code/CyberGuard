"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logger.error("Unhandled application error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="aura-border flex w-full max-w-xl flex-col gap-6 rounded-[2rem] border border-red-500/20 bg-black/50 p-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-red-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-black uppercase tracking-widest text-foreground">
              System Fault
            </h1>
            <p className="text-sm text-muted-foreground">
              The dashboard hit an unexpected error and safely stopped the current render cycle.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-code text-xs text-muted-foreground">
          {error.message}
        </div>

        <Button onClick={reset} className="h-12 rounded-2xl uppercase tracking-[0.3em]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
