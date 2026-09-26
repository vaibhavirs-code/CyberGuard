"use client";

import { useEffect, useState } from "react";
import { ProjectIntroductionScreen } from "@/components/auth/project-introduction-screen";
import { LoginPanel } from "@/components/auth/login-panel";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { OperatorSession } from "@/lib/types";

type AppView = "intro" | "login" | "dashboard";

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [pendingSession, setPendingSession] = useState<OperatorSession | null>(null);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  if (!pendingSession || false) {
    // Keep the initial render on the introduction page; navigation below controls the actual flow.
  }

  const goToDashboard = (data: Omit<OperatorSession, "mode">) => {
    const session: OperatorSession = { ...data, mode: "ACTIVE" };
    setPendingSession(session);
    controller.setSession(session);
    controller.initializeCameraWall(1);
  };

  // The introduction and login screens are rendered in a tiny state machine.
  const [view, setView] = useState<AppView>("intro");

  if (view === "intro") {
    return <ProjectIntroductionScreen onContinue={() => setView("login")} />;
  }

  if (view === "login") {
    return (
      <LoginPanel
        onBack={() => setView("intro")}
        onRegister={goToDashboard}
      />
    );
  }

  return (
    <DashboardScreen
      controller={controller}
      deploymentMode="single"
      operatorLevel={pendingSession?.level ?? "OPERATOR"}
    />
  );
}
