"use client";

import { useEffect, useState } from "react";
import { DeploymentSelectionScreen } from "@/components/auth/deployment-selection-screen";
import { LoginPanel } from "@/components/auth/login-panel";
import { SessionSetupScreen } from "@/components/auth/session-setup-screen";
import { ZoneConfigurationScreen } from "@/components/auth/zone-configuration-screen";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import { getAppConfig } from "@/lib/env";
import type { DeploymentConfig, OperatorSession } from "@/lib/types";

type AppView = "auth" | "deployment" | "setup" | "zoneConfig" | "dashboard";

const appConfig = getAppConfig();

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<AppView>("auth");
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig | null>(null);
  const [pendingSession, setPendingSession] = useState<OperatorSession | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (view === "deployment") {
    return (
      <DeploymentSelectionScreen
        onLaunch={(config) => {
          setDeploymentConfig(config);
          controller.initializeCameraWall(config.cameraCount);
          setView("auth");
        }}
      />
    );
  }

  if (view === "auth") {
    return (
      <LoginPanel
        onRegister={(session) => {
          setPendingSession({ ...session, mode: "ACTIVE" });
          setView("deployment");
        }}
        onSkip={() => {
          const localSession: OperatorSession = {
            name: "LOCAL_OPERATOR",
            id: "LOCAL-01",
            level: "OPERATOR",
            mode: "LOCAL",
            store: appConfig.NEXT_PUBLIC_DEFAULT_STORE_ID,
          };
          setPendingSession(localSession);
          setView("deployment");
        }}
      />
    );
  }

  if (view === "setup" && pendingSession) {
    return (
      <SessionSetupScreen
        session={pendingSession}
        onComplete={() => {
          setView("zoneConfig");
        }}
        onSkip={() => {
          setView("zoneConfig");
        }}
      />
    );
  }

  if (view === "zoneConfig" && pendingSession) {
    return (
      <ZoneConfigurationScreen
        zones={controller.zones}
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

  return <DashboardScreen controller={controller} deploymentMode={deploymentConfig?.mode ?? "single"} operatorLevel={pendingSession?.level ?? "OPERATOR"} />;
}
