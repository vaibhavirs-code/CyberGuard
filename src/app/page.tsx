"use client";

import { useEffect, useState } from "react";
import { ProjectIntroductionScreen } from "@/components/auth/project-introduction-screen";
import { LoginPanel } from "@/components/auth/login-panel";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { IndiaDpiPage } from "@/components/india/india-dpi-page";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { OperatorSession } from "@/lib/types";

type AppView = "intro" | "login" | "dashboard" | "india";

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<AppView>("intro");
  const [pendingSession, setPendingSession] = useState<OperatorSession | null>(null);

  useEffect(() => setIsMounted(true), []);

  const goToDashboard = (data: Omit<OperatorSession, "mode">) => {
    const session: OperatorSession = { ...data, mode: "ACTIVE" };
    setPendingSession(session);
    controller.setSession(session);
    controller.initializeCameraWall(1);
    setView("dashboard");
  };

  if (!isMounted) return null;

  if (view === "intro") {
    return <ProjectIntroductionScreen onContinue={() => setView("login")} />;
  }

  if (view === "login") {
    return <LoginPanel onBack={() => setView("intro")} onRegister={goToDashboard} />;
  }

  if (view === "india") {
    return <IndiaDpiPage onBack={() => setView("dashboard")} onOpenDashboard={() => setView("dashboard")} />;
  }

  return (
    <DashboardScreen
      controller={controller}
      deploymentMode="single"
      operatorLevel={pendingSession?.level ?? "OPERATOR"}
      onOpenIndiaPage={() => setView("india")}
    />
  );
}
