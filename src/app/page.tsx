"use client";

import { useEffect, useState } from "react";
import { ProjectIntroductionScreen } from "@/components/auth/project-introduction-screen";
import { DeploymentSelectionScreen } from "@/components/auth/deployment-selection-screen";
import { SessionSetupScreen } from "@/components/auth/session-setup-screen";
import { ZoneConfigurationScreen } from "@/components/auth/zone-configuration-screen";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { DeploymentConfig, OperatorSession } from "@/lib/types";

type AppView = "intro" | "deployment" | "setup" | "zoneConfig" | "dashboard";

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<AppView>("intro");
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig | null>(null);
  const [pendingSession, setPendingSession] = useState<OperatorSession | null>(null);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  if (view === "intro") {
    return <ProjectIntroductionScreen onContinue={() => setView("deployment")} />;
  }

  if (view === "deployment") {
    return (
      <DeploymentSelectionScreen
        onBack={() => setView("intro")}
        onLaunch={(config) => {
          setDeploymentConfig(config);
          controller.initializeCameraWall(config.cameraCount);
          setPendingSession({
            name: "Demo Operator",
            id: "DEMO-001",
            level: "OPERATOR",
            store: "Hackathon Demo Store",
            mode: "LOCAL",
          });
          setView("setup");
        }}
      />
    );
  }

  if (view === "setup" && pendingSession) {
    return (
      <SessionSetupScreen
        session={pendingSession}
        onBack={() => setView("deployment")}
        onComplete={() => setView("zoneConfig")}
        onSkip={() => setView("zoneConfig")}
      />
    );
  }

  if (view === "zoneConfig" && pendingSession) {
    return (
      <ZoneConfigurationScreen
        zones={controller.zones}
        onBack={() => setView("setup")}
        onContinueWithRecommendedLayout={() => {
          controller.setSession(pendingSession);
          setView("dashboard");
        }}
        onSaveLayout={(zones) => {
          controller.setZones(zones);
          controller.setSession(pendingSession);
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <DashboardScreen
      controller={controller}
      deploymentMode={deploymentConfig?.mode ?? "single"}
      operatorLevel={pendingSession?.level ?? "OPERATOR"}
    />
  );
}
