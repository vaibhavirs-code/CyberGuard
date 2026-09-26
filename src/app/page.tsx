"use client";

import { useEffect, useState } from "react";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { DeploymentConfig, OperatorSession } from "@/lib/types";

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [deploymentConfig] = useState<DeploymentConfig>({ mode: "single", cameraCount: 1 });
  const [pendingSession] = useState<OperatorSession>({
    name: "Demo Operator",
    id: "DEMO-001",
    level: "OPERATOR",
    store: "Hackathon Demo Store",
    mode: "LOCAL",
  });

  useEffect(() => {
    setIsMounted(true);
    controller.initializeCameraWall(1);
    controller.setSession(pendingSession);
    // The dashboard controller exposes the current render's actions; initialize once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <DashboardScreen
      controller={controller}
      deploymentMode={deploymentConfig.mode}
      operatorLevel={pendingSession.level}
    />
  );
}
